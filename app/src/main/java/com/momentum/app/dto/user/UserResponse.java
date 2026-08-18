package com.momentum.app.dto.user;

import java.time.LocalDateTime;

public record UserResponse(
    Long id,
    String username,
    String email,
    String profilePhoto,
    LocalDateTime createdAt
) {

}
