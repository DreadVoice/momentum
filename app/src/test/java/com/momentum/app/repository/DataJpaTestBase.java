package com.momentum.app.repository;

import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.mysql.MySQLContainer;

/**
 * Repository slice against a real MySQL. Flyway builds the schema and Hibernate validates
 * against it, so these tests exercise the same DDL production runs.
 */
@DataJpaTest(properties = {
        "spring.jpa.hibernate.ddl-auto=validate",
        "spring.jpa.show-sql=false"
})
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Testcontainers(disabledWithoutDocker = true)
abstract class DataJpaTestBase {

    // No @Container: JUnit stops a static container after each class, and every subclass
    // shares this one field. Spring Boot starts it instead and keeps it up for the JVM.
    @ServiceConnection
    static final MySQLContainer MYSQL = new MySQLContainer("mysql:8.4");
}
