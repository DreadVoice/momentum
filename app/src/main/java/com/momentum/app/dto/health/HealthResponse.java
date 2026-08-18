package com.momentum.app.dto.health;

import java.time.LocalDateTime;

public record HealthResponse(
    String status,
    LocalDateTime timestamp
) {

}
