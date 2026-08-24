package com.momentum.app.service.impl;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.HexFormat;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
import com.momentum.app.service.AuthService;
import com.momentum.app.service.JwtService;

import lombok.extern.slf4j.Slf4j;
import lombok.RequiredArgsConstructor;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final RefreshTokenRepository refreshTokenRepository;

    @Override
    public AuthResponse register(RegisterRequest request) {
        String normalizedUsername = request.username().trim();
        String normalizedEmail = request.email().trim().toLowerCase();

        if (userRepository.existsByUsername(normalizedUsername)) {
            throw new ResourceAlreadyExistsException("Username is already in use");
        }
        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new ResourceAlreadyExistsException("Email is already in use");
        }

        User user = User.builder()
                .username(normalizedUsername)
                .email(normalizedEmail)
                .password(passwordEncoder.encode(request.password()))
                .build();

        return issueTokens(userRepository.save(user));
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        String identifier = request.usernameOrEmail().trim();

        User user = identifier.contains("@")
                ? userRepository.findByEmail(identifier.toLowerCase()).orElse(null)
                : userRepository.findByUsername(identifier).orElse(null);

        if (user == null || !passwordEncoder.matches(request.password(), user.getPassword())) {
            log.warn("Failed login attempt for identifier {}", identifier);
            throw new InvalidCredentialsException("Invalid credentials");
        }

        refreshTokenRepository.deleteByUserIdAndExpiresAtBefore(user.getId(), LocalDateTime.now());
        return issueTokens(user);
    }

    @Override
    @Transactional(noRollbackFor = InvalidCredentialsException.class)
    public AuthResponse refresh(RefreshTokenRequest request) {
        String refreshToken = request.refreshToken();

        if (!jwtService.isRefreshToken(refreshToken)) {
            throw new InvalidCredentialsException("Invalid refresh token");
        }

        RefreshToken stored = refreshTokenRepository.findByTokenHash(hash(refreshToken)).orElse(null);

        if (stored == null) {
            Long userId = jwtService.extractUserId(refreshToken);
            log.warn("Refresh token reuse detected for user {}", userId);
            refreshTokenRepository.deleteByUserId(userId);
            throw new InvalidCredentialsException("Invalid refresh token");
        }

        User user = stored.getUser();
        if (!jwtService.isTokenValid(refreshToken, user)) {
            throw new InvalidCredentialsException("Invalid refresh token");
        }

        refreshTokenRepository.delete(stored);
        return issueTokens(user);
    }

    @Override
    public void logout(RefreshTokenRequest request) {
        refreshTokenRepository.deleteByTokenHash(hash(request.refreshToken()));
    }

    private AuthResponse issueTokens(User user) {
        String accessToken = jwtService.generateAccessToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);

        refreshTokenRepository.save(RefreshToken.builder()
                .tokenHash(hash(refreshToken))
                .user(user)
                .expiresAt(jwtService.extractExpiration(refreshToken))
                .build());

        return new AuthResponse(accessToken, refreshToken, user.getUsername());
    }

    private String hash(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(token.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 is not available", e);
        }
    }

}
