package com.momentum.app.dto.health;

import java.time.LocalDateTime;

// GET /api/health
public record HealthResponse(
    String status,
    LocalDateTime timestamp
) {

}
