package com.example.dms.notification;

import jakarta.validation.constraints.NotNull;

public record NotificationReadStateRequest(
    @NotNull Boolean read
) {
}
