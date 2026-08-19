package com.momentum.app.config;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.cors.CorsConfiguration;

class CorsConfigTest {

    private static final String UI_ORIGIN = "http://localhost:5173";

    private CorsConfiguration configurationFor(String path) {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", path);
        return new CorsConfig(List.of(UI_ORIGIN))
                .corsConfigurationSource()
                .getCorsConfiguration(request);
    }

    @Test
    void allowsConfiguredUiOrigin() {
        CorsConfiguration configuration = configurationFor("/api/tasks");

        assertThat(configuration).isNotNull();
        assertThat(configuration.checkOrigin(UI_ORIGIN)).isEqualTo(UI_ORIGIN);
    }

    @Test
    void rejectsUnknownOrigin() {
        CorsConfiguration configuration = configurationFor("/api/tasks");

        assertThat(configuration.checkOrigin("http://evil.example")).isNull();
    }

    @Test
    void allowsPreflightMethodsAndAuthorizationHeader() {
        CorsConfiguration configuration = configurationFor("/api/tasks");

        assertThat(configuration.checkHttpMethod(org.springframework.http.HttpMethod.DELETE)).isNotNull();
        assertThat(configuration.checkHeaders(List.of("Authorization"))).isNotEmpty();
    }

    @Test
    void doesNotApplyOutsideApiPaths() {
        assertThat(configurationFor("/error")).isNull();
    }

    @Test
    void doesNotAllowCredentials() {
        assertThat(configurationFor("/api/tasks").getAllowCredentials()).isFalse();
    }
}
