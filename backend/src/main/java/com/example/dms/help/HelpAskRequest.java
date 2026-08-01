package com.example.dms.help;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;

public record HelpAskRequest(
    @NotBlank
    @Size(max = 500, message = "Question must be 500 characters or less")
    String question,

    @Size(max = 16, message = "Locale must be 16 characters or less")
    String locale,

    @Valid
    @Size(max = 8, message = "Conversation context must contain 8 turns or less")
    List<ConversationTurn> context
) {
    public record ConversationTurn(
        @Size(max = 16, message = "Conversation role must be 16 characters or less")
        String role,

        @Size(max = 1200, message = "Conversation content must be 1200 characters or less")
        String content
    ) {
    }
}
