package com.momentum.app.integration;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;

/**
 * Replaces the old AppApplicationTests, which booted against whatever .env pointed at
 * and applied migrations to the developer's own database.
 */
class ContextLoadsIntegrationTest extends IntegrationTestBase {

    @Autowired
    private ApplicationContext context;

    @Test
    void contextLoads() {
        assertThat(context).isNotNull();
        assertThat(context.containsBean("securityFilterChain")).isTrue();
    }
}
