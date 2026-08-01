package com.example.dms.help;

import com.example.dms.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/help")
@RequiredArgsConstructor
public class HelpController {

    private final HelpAssistantService helpAssistantService;

    private final HelpInteractionService helpInteractionService;

    private final HelpRateLimiter helpRateLimiter;

    @PostMapping("/ask")
    @PreAuthorize("hasAuthority('AI_HELP_VIEW')")
    public ApiResponse<HelpAnswerResponse> ask(
        @Valid @RequestBody HelpAskRequest request,
        Authentication authentication
    ) {
        helpRateLimiter.checkAllowed();
        HelpAnswerResponse answer = helpAssistantService.answer(request, authentication);
        helpInteractionService.record(request.question(), answer);

        return ApiResponse.ok(answer);
    }

    @GetMapping("/history")
    @PreAuthorize("hasAuthority('TEAM_MANAGE')")
    public ApiResponse<Page<HelpInteractionResponse>> history(
        @RequestParam(defaultValue = "false") boolean mineOnly,
        @RequestParam(defaultValue = "") String keyword,
        @RequestParam(required = false) Boolean blocked,
        @PageableDefault(size = 12, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ApiResponse.ok(helpInteractionService.history(mineOnly, keyword, blocked, pageable));
    }

    @DeleteMapping("/history/{interactionId}")
    @PreAuthorize("hasAuthority('TEAM_MANAGE')")
    public ApiResponse<Void> deleteHistory(@PathVariable Long interactionId) {
        helpInteractionService.delete(interactionId);

        return ApiResponse.ok("AI history item deleted.", null);
    }
}
