package com.momentum.app.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.momentum.app.config.CorsConfig;
import com.momentum.app.config.SecurityConfig;
import com.momentum.app.dto.auth.AuthResponse;
import com.momentum.app.dto.auth.LoginRequest;
import com.momentum.app.dto.auth.RefreshTokenRequest;
import com.momentum.app.dto.auth.RegisterRequest;
import com.momentum.app.exception.GlobalExceptionHandler;
import com.momentum.app.exception.InvalidCredentialsException;
import com.momentum.app.exception.ResourceAlreadyExistsException;
import com.momentum.app.security.CustomUserDetailsService;
import com.momentum.app.security.JwtAccessDeniedHandler;
import com.momentum.app.security.JwtAuthenticationEntryPoint;
import com.momentum.app.security.RateLimitFilter;
import com.momentum.app.service.AuthService;
import com.momentum.app.service.JwtService;

import tools.jackson.databind.ObjectMapper;

@WebMvcTest(value = AuthController.class, properties = "app.ratelimit.capacity=1000")
@Import({ SecurityConfig.class, CorsConfig.class, GlobalExceptionHandler.class, RateLimitFilter.class })
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private AuthService authService;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private CustomUserDetailsService userDetailsService;

    @MockitoBean
    private JwtAuthenticationEntryPoint authenticationEntryPoint;

    @MockitoBean
    private JwtAccessDeniedHandler accessDeniedHandler;

    private static final AuthResponse TOKENS = new AuthResponse("access-token", "refresh-token", "alice");

    private String json(Object body) {
        return objectMapper.writeValueAsString(body);
    }

    @Test
    void register_returns201WithTokens() throws Exception {
        when(authService.register(any(RegisterRequest.class))).thenReturn(TOKENS);

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(new RegisterRequest("alice", "alice@example.com", "password123"))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.accessToken").value("access-token"))
                .andExpect(jsonPath("$.refreshToken").value("refresh-token"))
                .andExpect(jsonPath("$.username").value("alice"));
    }

    @Test
    void register_returns400WithFieldErrorsForInvalidBody() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(new RegisterRequest("a!", "not-an-email", "short"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Validation failed"))
                .andExpect(jsonPath("$.fieldErrors.username").exists())
                .andExpect(jsonPath("$.fieldErrors.email").exists())
                .andExpect(jsonPath("$.fieldErrors.password").exists());

        verify(authService, never()).register(any(RegisterRequest.class));
    }

    @Test
    void register_returns409WhenUserAlreadyExists() throws Exception {
        when(authService.register(any(RegisterRequest.class)))
                .thenThrow(new ResourceAlreadyExistsException("Username is already in use"));

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(new RegisterRequest("alice", "alice@example.com", "password123"))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Username is already in use"));
    }

    @Test
    void login_returns200WithTokens() throws Exception {
        when(authService.login(any(LoginRequest.class))).thenReturn(TOKENS);

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(new LoginRequest("alice", "password123"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").value("access-token"));
    }

    @Test
    void login_returns401ForBadCredentials() throws Exception {
        when(authService.login(any(LoginRequest.class)))
                .thenThrow(new InvalidCredentialsException("Invalid credentials"));

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(new LoginRequest("alice", "wrongpassword"))))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid credentials"));
    }

    @Test
    void refresh_returns200WithNewTokens() throws Exception {
        when(authService.refresh(any(RefreshTokenRequest.class))).thenReturn(TOKENS);

        mockMvc.perform(post("/api/auth/refresh")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(new RefreshTokenRequest("refresh-token"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").value("access-token"));
    }

    @Test
    void refresh_returns400ForBlankToken() throws Exception {
        mockMvc.perform(post("/api/auth/refresh")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(new RefreshTokenRequest(" "))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.refreshToken").exists());

        verify(authService, never()).refresh(any(RefreshTokenRequest.class));
    }
}
