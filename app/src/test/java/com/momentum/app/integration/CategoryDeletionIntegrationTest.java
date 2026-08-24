package com.momentum.app.integration;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import com.momentum.app.dto.category.CategoryCreateRequest;
import com.momentum.app.dto.category.CategoryResponse;
import com.momentum.app.dto.task.TaskCreateRequest;
import com.momentum.app.dto.task.TaskResponse;

class CategoryDeletionIntegrationTest extends IntegrationTestBase {

    @Test
    void deletingACategoryKeepsItsTasks() {
        String token = registerAndGetToken("nina");

        ResponseEntity<CategoryResponse> category = rest.exchange(
                "/api/categories", HttpMethod.POST,
                authedRequest(token, new CategoryCreateRequest("Work")),
                CategoryResponse.class);

        ResponseEntity<TaskResponse> task = rest.exchange(
                "/api/tasks", HttpMethod.POST,
                authedRequest(token, new TaskCreateRequest(
                        "Write the report", null, null, category.getBody().id(), null)),
                TaskResponse.class);

        ResponseEntity<String> deletion = rest.exchange(
                "/api/categories/" + category.getBody().id(), HttpMethod.DELETE,
                authedRequest(token), String.class);

        assertThat(deletion.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        assertThat(categoryRepository.count()).isZero();

        ResponseEntity<TaskResponse> survivor = rest.exchange(
                "/api/tasks/" + task.getBody().id(), HttpMethod.GET,
                authedRequest(token), TaskResponse.class);

        assertThat(survivor.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(survivor.getBody().title()).isEqualTo("Write the report");
        assertThat(survivor.getBody().categoryName()).isNull();
    }
}
