package com.momentum.app.dto.task;

import java.time.LocalDate;

import com.momentum.app.enums.TaskPriority;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

//POST /api/tasks
public record TaskCreateRequest(
    @NotBlank(message = "Title is required")
    @Size(max = 255, message = "Title cannot exceed 255 characters")
    String title,
    @Size(max = 1000, message = "Description cannot exceed 1000 characters")
    String description,
    TaskPriority priority,
    Long categoryId,
    @FutureOrPresent(message = "Due date must be in the present or future")
    LocalDate dueDate
) {

}
