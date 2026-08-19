package com.momentum.app.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.momentum.app.dto.auth.AuthResponse;
import com.momentum.app.dto.auth.LoginRequest;
import com.momentum.app.dto.auth.RefreshTokenRequest;
import com.momentum.app.dto.auth.RegisterRequest;
import com.momentum.app.entity.RefreshToken;
import com.momentum.app.entity.User;
import com.momentum.app.exception.InvalidCredentialsException;
import com.momentum.app.exception.ResourceAlreadyExistsException;
import com.momentum.app.repository.RefreshTokenRepository;
import com.momentum.app.repository.UserRepository;
import com.momentum.app.service.JwtService;

@ExtendWith(MockitoExtension.class)
class AuthServiceImplTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private JwtService jwtService;
    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @InjectMocks
    private AuthServiceImpl authService;

    private User existingUser() {
        return User.builder()
                .id(1L)
                .username("alice")
                .email("alice@example.com")
                .password("hashed")
                .build();
    }

    private void stubTokens(@SuppressWarnings("unused") User user) {
        when(jwtService.generateAccessToken(any(User.class))).thenReturn("access-token");
        when(jwtService.generateRefreshToken(any(User.class))).thenReturn("refresh-token");
        when(jwtService.extractExpiration("refresh-token"))
                .thenReturn(LocalDateTime.now().plusDays(7));
    }

    @Test
    void register_persistsUserAndReturnsTokens() {
        RegisterRequest request = new RegisterRequest("Alice", "Alice@Example.com", "password123");
        when(userRepository.existsByUsername("Alice")).thenReturn(false);
        when(userRepository.existsByEmail("alice@example.com")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("hashed");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setId(1L);
            return u;
        });
        stubTokens(null);

        AuthResponse response = authService.register(request);

        assertThat(response.accessToken()).isEqualTo("access-token");
        assertThat(response.refreshToken()).isEqualTo("refresh-token");
        assertThat(response.username()).isEqualTo("Alice");
    }

    @Test
    void register_rejectsDuplicateUsername() {
        RegisterRequest request = new RegisterRequest("Alice", "alice@example.com", "password123");
        when(userRepository.existsByUsername("Alice")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(ResourceAlreadyExistsException.class);
        verify(userRepository, never()).save(any());
    }

    @Test
    void register_rejectsDuplicateEmail() {
        RegisterRequest request = new RegisterRequest("Alice", "alice@example.com", "password123");
        when(userRepository.existsByUsername("Alice")).thenReturn(false);
        when(userRepository.existsByEmail("alice@example.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(ResourceAlreadyExistsException.class);
        verify(userRepository, never()).save(any());
    }

    @Test
    void login_withUsername_succeeds() {
        User user = existingUser();
        LoginRequest request = new LoginRequest("alice", "password123");
        when(userRepository.findByUsername("alice")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("password123", "hashed")).thenReturn(true);
        stubTokens(user);

        AuthResponse response = authService.login(request);

        assertThat(response.username()).isEqualTo("alice");
        verify(userRepository, never()).findByEmail(anyString());
    }

    @Test
    void login_withEmail_looksUpByEmail() {
        User user = existingUser();
        LoginRequest request = new LoginRequest("Alice@Example.com", "password123");
        when(userRepository.findByEmail("alice@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("password123", "hashed")).thenReturn(true);
        stubTokens(user);

        AuthResponse response = authService.login(request);

        assertThat(response.accessToken()).isEqualTo("access-token");
        verify(userRepository, never()).findByUsername(anyString());
    }

    @Test
    void login_withUnknownUser_throwsInvalidCredentials() {
        LoginRequest request = new LoginRequest("ghost", "password123");
        when(userRepository.findByUsername("ghost")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(InvalidCredentialsException.class);
    }

    @Test
    void login_withWrongPassword_throwsInvalidCredentials() {
        User user = existingUser();
        LoginRequest request = new LoginRequest("alice", "wrong");
        when(userRepository.findByUsername("alice")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong", "hashed")).thenReturn(false);

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(InvalidCredentialsException.class);
    }

    @Test
    void refresh_withValidToken_issuesNewTokens() {
        User user = existingUser();
        RefreshTokenRequest request = new RefreshTokenRequest("refresh-token");
        when(jwtService.isRefreshToken("refresh-token")).thenReturn(true);
        when(refreshTokenRepository.findByTokenHash(anyString()))
                .thenReturn(Optional.of(RefreshToken.builder().user(user).build()));
        when(jwtService.isTokenValid("refresh-token", user)).thenReturn(true);
        stubTokens(user);

        AuthResponse response = authService.refresh(request);

        assertThat(response.accessToken()).isEqualTo("access-token");
        assertThat(response.refreshToken()).isEqualTo("refresh-token");
    }

    @Test
    void refresh_withAccessToken_throwsInvalidCredentials() {
        RefreshTokenRequest request = new RefreshTokenRequest("access-token");
        when(jwtService.isRefreshToken("access-token")).thenReturn(false);

        assertThatThrownBy(() -> authService.refresh(request))
                .isInstanceOf(InvalidCredentialsException.class);
    }

    @Test
    void refresh_withRevokedToken_throwsInvalidCredentials() {
        RefreshTokenRequest request = new RefreshTokenRequest("refresh-token");
        when(jwtService.isRefreshToken("refresh-token")).thenReturn(true);
        when(refreshTokenRepository.findByTokenHash(anyString())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.refresh(request))
                .isInstanceOf(InvalidCredentialsException.class);
    }

    @Test
    void refresh_rotatesTheStoredToken() {
        User user = existingUser();
        RefreshToken stored = RefreshToken.builder().user(user).build();
        when(jwtService.isRefreshToken("refresh-token")).thenReturn(true);
        when(refreshTokenRepository.findByTokenHash(anyString())).thenReturn(Optional.of(stored));
        when(jwtService.isTokenValid("refresh-token", user)).thenReturn(true);
        stubTokens(user);

        authService.refresh(new RefreshTokenRequest("refresh-token"));

        verify(refreshTokenRepository).delete(stored);
        verify(refreshTokenRepository).save(any(RefreshToken.class));
    }

    @Test
    void logout_deletesTheStoredToken() {
        authService.logout(new RefreshTokenRequest("refresh-token"));

        verify(refreshTokenRepository).deleteByTokenHash(anyString());
    }
}
