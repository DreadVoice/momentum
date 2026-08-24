package com.momentum.app.service;

import java.util.List;

import org.springframework.data.domain.Pageable;

import com.momentum.app.dto.common.PageResponse;
import com.momentum.app.dto.task.TaskCreateRequest;
import com.momentum.app.dto.task.TaskPatchRequest;
import com.momentum.app.dto.task.TaskResponse;
import com.momentum.app.dto.task.TaskStatsResponse;
import com.momentum.app.dto.task.TaskUpdateRequest;
import com.momentum.app.enums.TaskPriority;
import com.momentum.app.enums.TaskStatus;

public interface TaskService {
    TaskResponse createTask(Long userId, TaskCreateRequest request);
    TaskResponse getTaskById(Long userId, Long taskId);
    TaskResponse updateTask(Long userId, Long taskId, TaskUpdateRequest request);
    TaskResponse patchTask(Long userId, Long taskId, TaskPatchRequest request);
    void deleteTask(Long userId, Long taskId);

    PageResponse<TaskResponse> getTasks(Long userId, TaskStatus status, TaskPriority priority,
            Long categoryId, Pageable pageable);
    List<TaskResponse> getOverdueTasks(Long userId);
    TaskStatsResponse getTaskStats(Long userId);
}
