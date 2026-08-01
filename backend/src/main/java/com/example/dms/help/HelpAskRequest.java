package com.example.dms.help;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record HelpAskRequest(
    @NotBlank
    @Size(max = 500, message = "Question must be 500 characters or less")
    String question
) {
}
