package com.momentum.app.dto.task;

import java.time.LocalDate;

import com.momentum.app.enums.TaskPriority;
import com.momentum.app.enums.TaskStatus;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

// PUT /api/tasks/{id}
public record TaskUpdateRequest(
    @NotBlank(message = "Title is required")
    @Size(max = 255, message = "Title cannot exceed 255 characters")
    String title,
    @Size(max = 1000, message = "Description cannot exceed 1000 characters")
    String description,
    TaskPriority priority,
    TaskStatus status,
    Long categoryId,
    LocalDate dueDate    
) {

}
