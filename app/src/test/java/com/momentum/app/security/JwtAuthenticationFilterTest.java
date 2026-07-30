package com.momentum.app.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import com.momentum.app.service.JwtService;

import jakarta.servlet.ServletException;
import java.io.IOException;

@ExtendWith(MockitoExtension.class)
class JwtAuthenticationFilterTest {

    private static final String TOKEN = "a.valid.token";

    @Mock
    private JwtService jwtService;

    @Mock
    private CustomUserDetailsService userDetailsService;

    private JwtAuthenticationFilter filter;
    private MockHttpServletRequest request;
    private MockHttpServletResponse response;
    private MockFilterChain chain;

    @BeforeEach
    @SuppressWarnings("unused")
    void setUp() {
        filter = new JwtAuthenticationFilter(jwtService, userDetailsService);
        request = new MockHttpServletRequest();
        request.setRequestURI("/api/tasks");
        response = new MockHttpServletResponse();
        chain = new MockFilterChain();
    }

    @AfterEach
    @SuppressWarnings("unused")
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private void doFilter() throws ServletException, IOException {
        filter.doFilter(request, response, chain);
    }

    private Object currentPrincipal() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication == null ? null : authentication.getPrincipal();
    }

    @Test
    void authenticatesValidAccessToken() throws Exception {
        UserPrincipal principal = new UserPrincipal(42L, "alice", "hash");
        request.addHeader("Authorization", "Bearer " + TOKEN);
        when(jwtService.isAccessToken(TOKEN)).thenReturn(true);
        when(jwtService.extractUserId(TOKEN)).thenReturn(42L);
        when(userDetailsService.loadUserById(42L)).thenReturn(principal);

        doFilter();

        assertThat(currentPrincipal()).isSameAs(principal);
        assertThat(chain.getRequest()).isNotNull();
    }

    @Test
    void rejectsRefreshTokenUsedAsBearerToken() throws Exception {
        request.addHeader("Authorization", "Bearer " + TOKEN);
        when(jwtService.isAccessToken(TOKEN)).thenReturn(false);

        doFilter();

        assertThat(currentPrincipal()).isNull();
        verify(userDetailsService, never()).loadUserById(anyLong());
    }

    @Test
    void leavesContextEmptyWhenHeaderIsMissing() throws Exception {
        doFilter();

        assertThat(currentPrincipal()).isNull();
        verify(jwtService, never()).extractUserId(TOKEN);
    }

    @Test
    void leavesContextEmptyForNonBearerHeader() throws Exception {
        request.addHeader("Authorization", "Basic dXNlcjpwYXNz");

        doFilter();

        assertThat(currentPrincipal()).isNull();
        verify(jwtService, never()).isAccessToken(TOKEN);
    }

    @Test
    void leavesContextEmptyWhenUserNoLongerExists() throws Exception {
        request.addHeader("Authorization", "Bearer " + TOKEN);
        when(jwtService.isAccessToken(TOKEN)).thenReturn(true);
        when(jwtService.extractUserId(TOKEN)).thenReturn(99L);
        when(userDetailsService.loadUserById(99L)).thenThrow(new UsernameNotFoundException("gone"));

        doFilter();

        assertThat(currentPrincipal()).isNull();
        assertThat(chain.getRequest()).isNotNull();
    }

    @Test
    void skipsAuthEndpointsEntirely() throws Exception {
        request.setRequestURI("/api/auth/login");
        request.addHeader("Authorization", "Bearer " + TOKEN);

        doFilter();

        assertThat(currentPrincipal()).isNull();
        verify(jwtService, never()).isAccessToken(TOKEN);
    }
}
