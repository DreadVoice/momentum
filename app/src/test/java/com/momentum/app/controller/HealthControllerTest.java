package com.momentum.app.controller;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.momentum.app.config.CorsConfig;
import com.momentum.app.config.SecurityConfig;
import com.momentum.app.exception.GlobalExceptionHandler;
import com.momentum.app.security.CustomUserDetailsService;
import com.momentum.app.security.JwtAccessDeniedHandler;
import com.momentum.app.security.JwtAuthenticationEntryPoint;
import com.momentum.app.security.RateLimitFilter;
import com.momentum.app.security.UserPrincipal;
import com.momentum.app.service.JwtService;

@WebMvcTest(HealthController.class)
@Import({ SecurityConfig.class, CorsConfig.class, GlobalExceptionHandler.class,
        JwtAuthenticationEntryPoint.class, JwtAccessDeniedHandler.class, RateLimitFilter.class })
class HealthControllerTest {

    private static final String TOKEN = "a.valid.token";

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private CustomUserDetailsService userDetailsService;

    @Test
    void health_isPublic() throws Exception {
        mockMvc.perform(get("/api/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"))
                .andExpect(jsonPath("$.timestamp").exists());
    }

    @Test
    void me_returnsPrincipalForValidAccessToken() throws Exception {
        when(jwtService.isAccessToken(TOKEN)).thenReturn(true);
        when(jwtService.extractUserId(TOKEN)).thenReturn(42L);
        when(userDetailsService.loadUserById(42L)).thenReturn(new UserPrincipal(42L, "alice", "hash"));

        mockMvc.perform(get("/api/health/me").header("Authorization", "Bearer " + TOKEN))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(42))
                .andExpect(jsonPath("$.username").value("alice"));
    }

    @Test
    void me_isRejectedWithoutToken() throws Exception {
        mockMvc.perform(get("/api/health/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Authentication required"));
    }

    @Test
    void me_isRejectedForRefreshToken() throws Exception {
        when(jwtService.isAccessToken(TOKEN)).thenReturn(false);

        mockMvc.perform(get("/api/health/me").header("Authorization", "Bearer " + TOKEN))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void health_isNotPublicForNonGetMethods() throws Exception {
        mockMvc.perform(post("/api/health"))
                .andExpect(status().isUnauthorized());
    }
}
