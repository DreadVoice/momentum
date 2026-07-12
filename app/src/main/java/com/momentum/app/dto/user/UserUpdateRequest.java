package com.momentum.app.dto.user;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UserUpdateRequest(
    @NotBlank(message = "Username is required")
    @Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
    @Pattern(regexp = "^[A-Za-z0-9_-]+$", message = "Username may only contain letters, numbers, underscores and hyphens")
    String username,
    @NotBlank(message = "Email is required")
    @Email(message = "Email should be valid")
    String email
) {

}
