package com.momentum.app.dto.subtask;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SubTaskUpdateRequest(
    @NotBlank(message = "Title is required")
    @Size(max = 50, message = "Title cannot exceed 50 characters")
    String title,
    boolean completed
) {

}
