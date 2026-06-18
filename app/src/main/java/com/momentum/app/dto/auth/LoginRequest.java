package com.momentum.app.dto.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

//POST /api/auth/login
public record LoginRequest(
    @NotBlank(message = "Username or email is required")
    String usernameOrEmail,
    @NotBlank(message = "Password is required")
    @Size(min = 8, max = 100, message = "Password must be at least 8 characters")
    String password) {

}
