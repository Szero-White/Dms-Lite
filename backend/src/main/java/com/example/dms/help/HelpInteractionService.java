package com.example.dms.help;

import com.example.dms.common.BusinessException;
import com.example.dms.common.TenantContext;
import com.example.dms.user.AppUser;
import com.example.dms.user.AppUserRepository;
import com.example.dms.user.Role;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class HelpInteractionService {

    private static final String LIST_SEPARATOR = "\n";

    private final HelpInteractionRepository interactions;

    private final AppUserRepository users;

    @Transactional
    public HelpInteractionResponse record(String question, HelpAnswerResponse answer) {
        Long tenantId = TenantContext.tenantRequired();
        Long actorId = TenantContext.userOrZero();
        AppUser actor = users.findByIdAndTenantId(actorId, tenantId)
            .orElseThrow(() -> new BusinessException("Current user not found"));

        HelpInteraction interaction = HelpInteraction.builder()
            .tenantId(tenantId)
            .actorId(actor.getId())
            .actorUsername(actor.getUsername())
            .actorFullName(actor.getFullName())
            .actorRoles(actor.getRoles().stream().map(Role::getName).sorted().collect(Collectors.joining(",")))
            .question(question.trim())
            .answer(answer.answer())
            .steps(join(answer.steps()))
            .relatedModules(join(answer.relatedModules()))
            .guardrails(join(answer.guardrails()))
            .scopeNotice(answer.scopeNotice())
            .blocked(answer.blocked())
            .answerSource(answer.answerSource())
            .generationProvider(answer.generationProvider())
            .build();

        return toResponse(interactions.save(interaction));
    }

    @Transactional(readOnly = true)
    public Page<HelpInteractionResponse> history(
        boolean mineOnly,
        String keyword,
        Boolean blocked,
        Pageable pageable
    ) {
        Long tenantId = TenantContext.tenantRequired();
        Long actorId = mineOnly ? TenantContext.userOrZero() : null;

        return interactions.searchHistory(tenantId, actorId, normalizeKeyword(keyword), blocked, pageable)
            .map(this::toResponse);
    }

    @Transactional
    public void delete(Long interactionId) {
        Long tenantId = TenantContext.tenantRequired();
        HelpInteraction interaction = interactions.findByIdAndTenantId(interactionId, tenantId)
            .orElseThrow(() -> new BusinessException("AI history item not found"));

        interactions.delete(interaction);
    }

    private HelpInteractionResponse toResponse(HelpInteraction interaction) {
        return new HelpInteractionResponse(
            interaction.getId(),
            interaction.getActorId(),
            interaction.getActorUsername(),
            interaction.getActorFullName(),
            split(interaction.getActorRoles()),
            interaction.getQuestion(),
            interaction.getAnswer(),
            split(interaction.getSteps()),
            split(interaction.getRelatedModules()),
            split(interaction.getGuardrails()),
            interaction.getScopeNotice(),
            interaction.isBlocked(),
            interaction.getAnswerSource(),
            interaction.getGenerationProvider(),
            interaction.getCreatedAt()
        );
    }

    private String join(List<String> values) {
        return String.join(LIST_SEPARATOR, values);
    }

    private List<String> split(String value) {
        if (value == null || value.isBlank()) {
            return List.of();
        }

        return Arrays.stream(value.split(LIST_SEPARATOR))
            .filter(item -> !item.isBlank())
            .toList();
    }

    private String normalizeKeyword(String keyword) {
        return keyword == null ? "" : keyword.trim();
    }
}
