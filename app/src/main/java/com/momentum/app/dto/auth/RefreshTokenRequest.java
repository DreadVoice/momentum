package com.momentum.app.dto.auth;

import jakarta.validation.constraints.NotBlank;

// POST /api/auth/refresh
public record RefreshTokenRequest(
    @NotBlank(message = "Refresh token is required")
    String refreshToken) {

}
