package com.momentum.app.integration;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import com.momentum.app.dto.category.CategoryCreateRequest;
import com.momentum.app.dto.category.CategoryResponse;
import com.momentum.app.dto.subtask.SubTaskCreateRequest;
import com.momentum.app.dto.subtask.SubTaskResponse;
import com.momentum.app.dto.subtask.SubTaskUpdateRequest;
import com.momentum.app.dto.task.TaskCreateRequest;
import com.momentum.app.dto.task.TaskResponse;
import com.momentum.app.dto.task.TaskUpdateRequest;
import com.momentum.app.enums.TaskPriority;
import com.momentum.app.enums.TaskStatus;

class TaskOwnershipIntegrationTest extends IntegrationTestBase {

    private String aliceToken;
    private String bobToken;

    @BeforeEach
    void registerBothUsers() {
        aliceToken = registerAndGetToken("alice");
        bobToken = registerAndGetToken("bob");
    }

    private TaskResponse createTask(String token, String title) {
        ResponseEntity<TaskResponse> response = rest.exchange(
                "/api/tasks", HttpMethod.POST,
                authedRequest(token, new TaskCreateRequest(
                        title, "description", TaskPriority.HIGH, null, LocalDate.now().plusDays(3))),
                TaskResponse.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        return response.getBody();
    }

    private SubTaskResponse createSubTask(String token, Long taskId, String title) {
        ResponseEntity<SubTaskResponse> response = rest.exchange(
                "/api/tasks/" + taskId + "/subtasks", HttpMethod.POST,
                authedRequest(token, new SubTaskCreateRequest(title)),
                SubTaskResponse.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        return response.getBody();
    }

    @Test
    void registeredUserCanRoundTripATaskWithItsOwnToken() {
        TaskResponse created = createTask(aliceToken, "Write the report");

        assertThat(created.id()).isNotNull();
        assertThat(created.status()).isEqualTo(TaskStatus.PENDING);
        assertThat(created.priority()).isEqualTo(TaskPriority.HIGH);

        ResponseEntity<TaskResponse> fetched = rest.exchange(
                "/api/tasks/" + created.id(), HttpMethod.GET, authedRequest(aliceToken), TaskResponse.class);

        assertThat(fetched.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(fetched.getBody().title()).isEqualTo("Write the report");
        assertThat(fetched.getBody().createdAt()).isNotNull();
    }

    @Test
    void bobCannotReadAlicesTask() {
        TaskResponse alicesTask = createTask(aliceToken, "Alice's private task");

        ResponseEntity<String> response = rest.exchange(
                "/api/tasks/" + alicesTask.id(), HttpMethod.GET, authedRequest(bobToken), String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(response.getBody()).doesNotContain("Alice's private task");
    }

    @Test
    void bobCannotUpdateAlicesTask() {
        TaskResponse alicesTask = createTask(aliceToken, "Alice's private task");

        ResponseEntity<String> response = rest.exchange(
                "/api/tasks/" + alicesTask.id(), HttpMethod.PUT,
                authedRequest(bobToken, new TaskUpdateRequest(
                        "Hijacked", null, TaskPriority.LOW, TaskStatus.COMPLETED, null, null)),
                String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);

        ResponseEntity<TaskResponse> stillAlices = rest.exchange(
                "/api/tasks/" + alicesTask.id(), HttpMethod.GET, authedRequest(aliceToken), TaskResponse.class);
        assertThat(stillAlices.getBody().title()).isEqualTo("Alice's private task");
        assertThat(stillAlices.getBody().status()).isEqualTo(TaskStatus.PENDING);
    }

    @Test
    void bobCannotDeleteAlicesTask() {
        TaskResponse alicesTask = createTask(aliceToken, "Alice's private task");

        ResponseEntity<String> response = rest.exchange(
                "/api/tasks/" + alicesTask.id(), HttpMethod.DELETE, authedRequest(bobToken), String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);

        ResponseEntity<TaskResponse> stillThere = rest.exchange(
                "/api/tasks/" + alicesTask.id(), HttpMethod.GET, authedRequest(aliceToken), TaskResponse.class);
        assertThat(stillThere.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void bobsTaskListNeverContainsAlicesTasks() {
        createTask(aliceToken, "Alice's private task");
        createTask(bobToken, "Bob's own task");

        ResponseEntity<String> bobsTasks = rest.exchange(
                "/api/tasks", HttpMethod.GET, authedRequest(bobToken), String.class);

        assertThat(bobsTasks.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(bobsTasks.getBody())
                .contains("\"content\":")
                .contains("\"totalElements\":1")
                .contains("Bob's own task")
                .doesNotContain("Alice's private task");
    }

    @Test
    void bobsStatsCountOnlyHisOwnTasks() {
        createTask(aliceToken, "Alice one");
        createTask(aliceToken, "Alice two");
        createTask(bobToken, "Bob one");

        ResponseEntity<String> stats = rest.exchange(
                "/api/tasks/stats", HttpMethod.GET, authedRequest(bobToken), String.class);

        assertThat(stats.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(stats.getBody()).contains("\"total\":1");
    }

    @Test
    void bobCannotAddSubTasksToAlicesTask() {
        TaskResponse alicesTask = createTask(aliceToken, "Alice's private task");

        ResponseEntity<String> response = rest.exchange(
                "/api/tasks/" + alicesTask.id() + "/subtasks", HttpMethod.POST,
                authedRequest(bobToken, new SubTaskCreateRequest("Injected step")),
                String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void bobCannotToggleOrEditAlicesSubTask() {
        TaskResponse alicesTask = createTask(aliceToken, "Alice's private task");
        SubTaskResponse alicesSubTask = createSubTask(aliceToken, alicesTask.id(), "Alice's step");

        ResponseEntity<String> toggled = rest.exchange(
                "/api/subtasks/" + alicesSubTask.id() + "/toggle", HttpMethod.PATCH,
                authedRequest(bobToken), String.class);
        assertThat(toggled.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);

        ResponseEntity<String> updated = rest.exchange(
                "/api/subtasks/" + alicesSubTask.id(), HttpMethod.PUT,
                authedRequest(bobToken, new SubTaskUpdateRequest("Hijacked step", true)),
                String.class);
        assertThat(updated.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);

        ResponseEntity<SubTaskResponse[]> alicesSubTasks = rest.exchange(
                "/api/tasks/" + alicesTask.id() + "/subtasks", HttpMethod.GET,
                authedRequest(aliceToken), SubTaskResponse[].class);
        assertThat(alicesSubTasks.getBody()).hasSize(1);
        assertThat(alicesSubTasks.getBody()[0].title()).isEqualTo("Alice's step");
        assertThat(alicesSubTasks.getBody()[0].completed()).isFalse();
    }

    @Test
    void bobCannotAttachAlicesCategoryToHisOwnTask() {
        ResponseEntity<CategoryResponse> alicesCategory = rest.exchange(
                "/api/categories", HttpMethod.POST,
                authedRequest(aliceToken, new CategoryCreateRequest("Alice Work")),
                CategoryResponse.class);
        assertThat(alicesCategory.getStatusCode()).isEqualTo(HttpStatus.CREATED);

        ResponseEntity<String> response = rest.exchange(
                "/api/tasks", HttpMethod.POST,
                authedRequest(bobToken, new TaskCreateRequest(
                        "Bob's task", null, null, alicesCategory.getBody().id(), null)),
                String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(response.getBody()).contains("Category not found");
    }

    @Test
    void requestsWithoutATokenAreRejected() {
        TaskResponse alicesTask = createTask(aliceToken, "Alice's private task");

        assertThat(rest.getForEntity("/api/tasks", String.class).getStatusCode())
                .isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(rest.getForEntity("/api/tasks/" + alicesTask.id(), String.class).getStatusCode())
                .isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void refreshTokenIsRejectedAsAccessToken() {
        ResponseEntity<com.momentum.app.dto.auth.AuthResponse> registration = rest.postForEntity(
                "/api/auth/register",
                new com.momentum.app.dto.auth.RegisterRequest("carol", "carol@example.com", "password123"),
                com.momentum.app.dto.auth.AuthResponse.class);

        String refreshToken = registration.getBody().refreshToken();

        ResponseEntity<String> response = rest.exchange(
                "/api/tasks", HttpMethod.GET, authedRequest(refreshToken), String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }
}
