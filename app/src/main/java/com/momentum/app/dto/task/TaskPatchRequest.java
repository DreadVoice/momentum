package com.momentum.app.dto.task;

import java.time.LocalDate;

import com.momentum.app.enums.TaskPriority;
import com.momentum.app.enums.TaskStatus;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record TaskPatchRequest(
    @Pattern(regexp = ".*\\S.*", message = "Title cannot be blank")
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
