package com.momentum.app.dto.task;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import com.momentum.app.dto.subtask.SubTaskResponse;
import com.momentum.app.enums.TaskPriority;
import com.momentum.app.enums.TaskStatus;

//GET /api/tasks
//GET /api/tasks/{id}
public record TaskResponse(
    Long id,
    String title,
    String description,
    TaskPriority priority,
    TaskStatus status,
    String categoryName,
    LocalDate dueDate,
    LocalDateTime createdAt,
    LocalDateTime updatedAt,
    List<SubTaskResponse> subTasks,
    int subTaskCount,
    int completedSubTaskCount
) {

}
