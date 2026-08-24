package com.momentum.app.integration;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import com.momentum.app.dto.auth.AuthResponse;
import com.momentum.app.dto.auth.LoginRequest;
import com.momentum.app.dto.auth.RefreshTokenRequest;
import com.momentum.app.dto.auth.RegisterRequest;
import com.momentum.app.dto.user.ChangePasswordRequest;

class RefreshTokenIntegrationTest extends IntegrationTestBase {

    private AuthResponse register(String username) {
        return rest.postForEntity("/api/auth/register",
                new RegisterRequest(username, username + "@example.com", "password123"),
                AuthResponse.class).getBody();
    }

    private ResponseEntity<String> refresh(String token) {
        return rest.postForEntity("/api/auth/refresh", new RefreshTokenRequest(token), String.class);
    }

    private ResponseEntity<String> logout(String token) {
        return rest.postForEntity("/api/auth/logout", new RefreshTokenRequest(token), String.class);
    }

    @Test
    void registrationPersistsARefreshToken() {
        register("hana");

        assertThat(refreshTokenRepository.count()).isEqualTo(1);
    }

    @Test
    void logoutRevokesTheRefreshToken() {
        AuthResponse auth = register("ivan");

        assertThat(logout(auth.refreshToken()).getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        assertThat(refreshTokenRepository.count()).isZero();
        assertThat(refresh(auth.refreshToken()).getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void logoutIsIdempotentForAnUnknownToken() {
        AuthResponse auth = register("jade");
        logout(auth.refreshToken());

        assertThat(logout(auth.refreshToken()).getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
    }

    @Test
    void refreshRotatesTheTokenAndRejectsTheOldOne() {
        AuthResponse auth = register("kira");

        ResponseEntity<AuthResponse> rotated = rest.postForEntity("/api/auth/refresh",
                new RefreshTokenRequest(auth.refreshToken()), AuthResponse.class);

        assertThat(rotated.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(rotated.getBody().refreshToken()).isNotEqualTo(auth.refreshToken());
        assertThat(refreshTokenRepository.count()).isEqualTo(1);
        assertThat(refresh(auth.refreshToken()).getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(refresh(rotated.getBody().refreshToken()).getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void loggingInIssuesAnAdditionalToken() {
        register("liam");

        rest.postForEntity("/api/auth/login",
                new LoginRequest("liam", "password123"), AuthResponse.class);

        assertThat(refreshTokenRepository.count()).isEqualTo(2);
    }

    @Test
    void deletingAnAccountRemovesItsRefreshTokens() {
        AuthResponse auth = register("mona");

        ResponseEntity<String> deletion = rest.exchange("/api/users/me", HttpMethod.DELETE,
                authedRequest(auth.accessToken(),
                        new com.momentum.app.dto.user.DeleteAccountRequest("password123")),
                String.class);

        assertThat(deletion.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        assertThat(refreshTokenRepository.count()).isZero();
    }
    @Test
    void changingThePasswordRevokesExistingRefreshTokens() {
        AuthResponse auth = register("nora");

        ResponseEntity<String> change = rest.exchange("/api/users/me/password", HttpMethod.PATCH,
                authedRequest(auth.accessToken(),
                        new ChangePasswordRequest("password123", "newpassword456")),
                String.class);

        assertThat(change.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        assertThat(refreshTokenRepository.count()).isZero();
        assertThat(refresh(auth.refreshToken()).getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

}
