package com.momentum.app.dto.user;

import jakarta.validation.constraints.NotBlank;

// DELETE /api/users/me
public record DeleteAccountRequest(
    @NotBlank(message = "Password is required")
    String password
) {

}
