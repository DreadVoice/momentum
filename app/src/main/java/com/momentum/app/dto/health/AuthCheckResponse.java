package com.momentum.app.dto.health;

import java.time.LocalDateTime;

public record AuthCheckResponse(
    Long userId,
    String username,
    LocalDateTime timestamp
) {

}
