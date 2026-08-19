package com.momentum.app.integration;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import com.momentum.app.dto.category.CategoryCreateRequest;
import com.momentum.app.dto.category.CategoryResponse;
import com.momentum.app.dto.subtask.SubTaskCreateRequest;
import com.momentum.app.dto.task.TaskCreateRequest;
import com.momentum.app.dto.task.TaskResponse;
import com.momentum.app.dto.user.DeleteAccountRequest;

class AccountDeletionIntegrationTest extends IntegrationTestBase {

    @Test
    void deletingAnAccountRemovesEverythingItOwns() {
        String token = registerAndGetToken("dana");

        ResponseEntity<CategoryResponse> category = rest.exchange(
                "/api/categories", HttpMethod.POST,
                authedRequest(token, new CategoryCreateRequest("Errands")),
                CategoryResponse.class);
        assertThat(category.getStatusCode()).isEqualTo(HttpStatus.CREATED);

        ResponseEntity<TaskResponse> task = rest.exchange(
                "/api/tasks", HttpMethod.POST,
                authedRequest(token, new TaskCreateRequest(
                        "Buy milk", null, null, category.getBody().id(), null)),
                TaskResponse.class);
        assertThat(task.getStatusCode()).isEqualTo(HttpStatus.CREATED);

        ResponseEntity<String> subTask = rest.exchange(
                "/api/tasks/" + task.getBody().id() + "/subtasks", HttpMethod.POST,
                authedRequest(token, new SubTaskCreateRequest("Check the fridge")),
                String.class);
        assertThat(subTask.getStatusCode()).isEqualTo(HttpStatus.CREATED);

        ResponseEntity<String> deletion = rest.exchange(
                "/api/users/me", HttpMethod.DELETE,
                authedRequest(token, new DeleteAccountRequest("password123")),
                String.class);

        assertThat(deletion.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        assertThat(userRepository.count()).isZero();
        assertThat(categoryRepository.count()).isZero();
        assertThat(taskRepository.count()).isZero();
        assertThat(subTaskRepository.count()).isZero();
    }
}
