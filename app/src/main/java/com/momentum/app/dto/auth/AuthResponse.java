package com.momentum.app.dto.auth;

public record AuthResponse(String accessToken, String refreshToken, String username) {

}
