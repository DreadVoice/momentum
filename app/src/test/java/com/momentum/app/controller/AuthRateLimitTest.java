package com.momentum.app.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
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
import org.springframework.test.web.servlet.ResultActions;

import com.momentum.app.config.CorsConfig;
import com.momentum.app.config.SecurityConfig;
import com.momentum.app.dto.auth.AuthResponse;
import com.momentum.app.exception.GlobalExceptionHandler;
import com.momentum.app.security.CustomUserDetailsService;
import com.momentum.app.security.JwtAccessDeniedHandler;
import com.momentum.app.security.JwtAuthenticationEntryPoint;
import com.momentum.app.security.RateLimitFilter;
import com.momentum.app.service.AuthService;
import com.momentum.app.service.JwtService;

@WebMvcTest(value = { AuthController.class, HealthController.class },
        properties = "app.ratelimit.capacity=3")
@Import({ SecurityConfig.class, CorsConfig.class, GlobalExceptionHandler.class,
        JwtAuthenticationEntryPoint.class, JwtAccessDeniedHandler.class, RateLimitFilter.class })
class AuthRateLimitTest {

    private static final String LOGIN_BODY = "{\"usernameOrEmail\":\"alice\",\"password\":\"password123\"}";

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AuthService authService;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private CustomUserDetailsService userDetailsService;

    private ResultActions login(String client) throws Exception {
        return mockMvc.perform(post("/api/auth/login")
                .header("X-Forwarded-For", client)
                .contentType(MediaType.APPLICATION_JSON).content(LOGIN_BODY));
    }

    @Test
    void allowsRequestsUpToTheConfiguredCapacity() throws Exception {
        when(authService.login(any())).thenReturn(new AuthResponse("a", "r", "alice"));

        for (int i = 0; i < 3; i++) {
            login("10.0.0.1").andExpect(status().isOk());
        }
    }

    @Test
    void returns429OnceTheCapacityIsExhausted() throws Exception {
        when(authService.login(any())).thenReturn(new AuthResponse("a", "r", "alice"));
        for (int i = 0; i < 3; i++) {
            login("10.0.0.2").andExpect(status().isOk());
        }

        login("10.0.0.2")
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.status").value(429))
                .andExpect(jsonPath("$.message").value("Too many requests. Try again later."));
    }

    @Test
    void doesNotLimitEndpointsOutsideAuth() throws Exception {
        when(authService.login(any())).thenReturn(new AuthResponse("a", "r", "alice"));
        for (int i = 0; i < 5; i++) {
            login("10.0.0.3");
        }

        mockMvc.perform(get("/api/health").header("X-Forwarded-For", "10.0.0.3"))
                .andExpect(status().isOk());
    }
}
