package com.momentum.app.service.impl;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.momentum.app.entity.User;

class JwtServiceImplTest {

    private static final String SECRET = "test-secret-key-that-is-long-enough-256-bits!!";
    private static final long ACCESS_MS = 900_000L;
    private static final long REFRESH_MS = 604_800_000L;

    private JwtServiceImpl jwtService;

    private User user(Long id) {
        return User.builder().id(id).username("alice").email("alice@example.com").password("hash").build();
    }

    @BeforeEach
    void setUp() {
        jwtService = new JwtServiceImpl(SECRET, ACCESS_MS, REFRESH_MS);
    }

    @Test
    void generateAccessToken_isValidAndCarriesUserId() {
        User user = user(42L);

        String token = jwtService.generateAccessToken(user);

        assertThat(token).isNotBlank();
        assertThat(jwtService.extractUserId(token)).isEqualTo(42L);
        assertThat(jwtService.isTokenValid(token, user)).isTrue();
        assertThat(jwtService.isRefreshToken(token)).isFalse();
    }

    @Test
    void generateRefreshToken_isRecognizedAsRefresh() {
        User user = user(7L);

        String token = jwtService.generateRefreshToken(user);

        assertThat(jwtService.extractUserId(token)).isEqualTo(7L);
        assertThat(jwtService.isRefreshToken(token)).isTrue();
    }

    @Test
    void isTokenValid_returnsFalseForDifferentUser() {
        String token = jwtService.generateAccessToken(user(1L));

        assertThat(jwtService.isTokenValid(token, user(2L))).isFalse();
    }

    @Test
    void isTokenValid_returnsFalseForMalformedToken() {
        assertThat(jwtService.isTokenValid("not-a-jwt", user(1L))).isFalse();
    }

    @Test
    void isTokenValid_returnsFalseForTokenSignedWithDifferentSecret() {
        JwtServiceImpl otherService =
                new JwtServiceImpl("a-completely-different-secret-key-256-bits-long!", ACCESS_MS, REFRESH_MS);
        String foreignToken = otherService.generateAccessToken(user(1L));

        assertThat(jwtService.isTokenValid(foreignToken, user(1L))).isFalse();
    }

    @Test
    void isTokenValid_returnsFalseForExpiredToken() {
        JwtServiceImpl expiringService = new JwtServiceImpl(SECRET, -1_000L, -1_000L);
        User user = user(1L);
        String expired = expiringService.generateAccessToken(user);

        assertThat(jwtService.isTokenValid(expired, user)).isFalse();
    }

    @Test
    void isRefreshToken_returnsFalseForMalformedToken() {
        assertThat(jwtService.isRefreshToken("garbage")).isFalse();
    }
}
