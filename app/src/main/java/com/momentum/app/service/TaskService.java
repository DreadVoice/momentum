package com.momentum.app.service;

import java.util.List;

import com.momentum.app.dto.task.TaskCreateRequest;
import com.momentum.app.dto.task.TaskResponse;
import com.momentum.app.dto.task.TaskUpdateRequest;
import com.momentum.app.enums.TaskPriority;
import com.momentum.app.enums.TaskStatus;

public interface TaskService {
    TaskResponse createTask(Long userId, TaskCreateRequest taskRequest);
    TaskResponse getTaskById(Long userId, Long taskId);
    TaskResponse updateTask(Long userId, Long taskId, TaskUpdateRequest taskRequest);
    void deleteTask(Long userId, Long taskId);

    List<TaskResponse> getAllTasks(Long userId);
    List<TaskResponse> getTasksByStatus(Long userId, TaskStatus status);
    List<TaskResponse> getTasksByPriority(Long userId, TaskPriority priority);
    List<TaskResponse> getTasksByCategory(Long userId, Long categoryId);
    List<TaskResponse> getOverdueTasks(Long userId);
    long countTasksByStatus(Long userId, TaskStatus status);
}
