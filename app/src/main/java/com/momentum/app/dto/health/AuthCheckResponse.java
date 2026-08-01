package com.momentum.app.dto.health;

import java.time.LocalDateTime;

// GET /api/health/me
public record AuthCheckResponse(
    Long userId,
    String username,
    LocalDateTime timestamp
) {

}
