package com.momentum.app.dto.user;

import jakarta.validation.constraints.NotBlank;

public record DeleteAccountRequest(
    @NotBlank(message = "Password is required")
    String password
) {

}
