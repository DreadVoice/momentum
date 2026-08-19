package com.momentum.app.integration;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import com.momentum.app.dto.task.TaskCreateRequest;

class TaskListingIntegrationTest extends IntegrationTestBase {

    private void createTask(String token, String title) {
        rest.exchange("/api/tasks", HttpMethod.POST,
                authedRequest(token, new TaskCreateRequest(title, null, null, null, null)),
                String.class);
    }

    @Test
    void rejectsAnUnknownSortProperty() {
        String token = registerAndGetToken("erin");
        createTask(token, "Task A");

        ResponseEntity<String> response = rest.exchange(
                "/api/tasks?sort=bogus", HttpMethod.GET, authedRequest(token), String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }
    @Test
    void reportsWhichPropertiesAreSortable() {
        String token = registerAndGetToken("frank");

        ResponseEntity<String> response = rest.exchange(
                "/api/tasks?sort=password", HttpMethod.GET, authedRequest(token), String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).contains(
                "Cannot sort by 'password'. Allowed values: [createdAt, dueDate, priority, status, title].");
    }

    @Test
    void sortsAndPagesAcrossTheWholeList() {
        String token = registerAndGetToken("gina");
        createTask(token, "C task");
        createTask(token, "A task");
        createTask(token, "B task");

        ResponseEntity<String> page = rest.exchange(
                "/api/tasks?sort=title&page=0&size=2", HttpMethod.GET,
                authedRequest(token), String.class);

        assertThat(page.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(page.getBody())
                .contains("\"totalElements\":3")
                .contains("\"totalPages\":2");
        assertThat(page.getBody().indexOf("A task")).isLessThan(page.getBody().indexOf("B task"));
        assertThat(page.getBody()).doesNotContain("C task");
    }

}
