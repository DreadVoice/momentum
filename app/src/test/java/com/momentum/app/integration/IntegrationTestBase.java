package com.momentum.app.integration;

import org.junit.jupiter.api.AfterEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.boot.resttestclient.TestRestTemplate;
import org.springframework.boot.resttestclient.autoconfigure.AutoConfigureTestRestTemplate;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.testcontainers.mysql.MySQLContainer;
import org.testcontainers.junit.jupiter.Testcontainers;

import com.momentum.app.dto.auth.AuthResponse;
import com.momentum.app.dto.auth.RegisterRequest;
import com.momentum.app.repository.CategoryRepository;
import com.momentum.app.repository.SubTaskRepository;
import com.momentum.app.repository.TaskRepository;
import com.momentum.app.repository.UserRepository;

@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT, properties = {
        "app.jwt.secret=integration-test-signing-key-long-enough-for-hs256!",
        "app.cors.allowed-origins=http://localhost:5173",
        // Flyway builds the schema and Hibernate validates against it, so a migration that
        // drifts from the entities fails the suite rather than passing silently.
        "spring.jpa.hibernate.ddl-auto=validate",
        "spring.jpa.show-sql=false"
})
@AutoConfigureTestRestTemplate
@Testcontainers(disabledWithoutDocker = true)
abstract class IntegrationTestBase {

    // No @Container: JUnit stops a static container after each class, and every subclass
    // shares this one field. Spring Boot starts it instead and keeps it up for the JVM.
    @ServiceConnection
    static final MySQLContainer MYSQL = new MySQLContainer("mysql:8.4");

    @Autowired
    protected TestRestTemplate rest;

    @Autowired
    private SubTaskRepository subTaskRepository;
    @Autowired
    private TaskRepository taskRepository;
    @Autowired
    private CategoryRepository categoryRepository;
    @Autowired
    private UserRepository userRepository;

    @AfterEach
    void clearDatabase() {
        subTaskRepository.deleteAll();
        taskRepository.deleteAll();
        categoryRepository.deleteAll();
        userRepository.deleteAll();
    }

    protected String registerAndGetToken(String username) {
        ResponseEntity<AuthResponse> response = rest.postForEntity(
                "/api/auth/register",
                new RegisterRequest(username, username + "@example.com", "password123"),
                AuthResponse.class);

        if (response.getBody() == null) {
            throw new IllegalStateException("Registration failed for " + username + ": " + response.getStatusCode());
        }
        return response.getBody().accessToken();
    }

    protected HttpHeaders bearer(String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        headers.setContentType(MediaType.APPLICATION_JSON);
        return headers;
    }

    protected HttpEntity<Void> authedRequest(String token) {
        return new HttpEntity<>(bearer(token));
    }

    protected <T> HttpEntity<T> authedRequest(String token, T body) {
        return new HttpEntity<>(body, bearer(token));
    }
}
