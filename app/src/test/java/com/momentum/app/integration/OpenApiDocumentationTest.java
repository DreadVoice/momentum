package com.momentum.app.integration;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

class OpenApiDocumentationTest extends IntegrationTestBase {

    private JsonNode paths() {
        ResponseEntity<String> response = rest.getForEntity("/v3/api-docs", String.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        return JsonMapper.builder().build().readTree(response.getBody()).get("paths");
    }

    @Test
    void specIsServedWithoutAuthentication() {
        assertThat(paths()).isNotNull();
    }

    @Test
    void specDocumentsEveryPatchEndpoint() {
        JsonNode paths = paths();
        List<String> patched = paths.propertyNames().stream()
                .filter(path -> paths.get(path).has("patch"))
                .sorted()
                .toList();

        assertThat(patched).containsExactly(
                "/api/categories/{categoryId}",
                "/api/subtasks/{subTaskId}",
                "/api/subtasks/{subTaskId}/toggle",
                "/api/tasks/{taskId}",
                "/api/users/me",
                "/api/users/me/password");
    }
}
