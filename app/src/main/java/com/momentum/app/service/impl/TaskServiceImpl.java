    package com.momentum.app.service.impl;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

import org.springframework.stereotype.Service;

import com.momentum.app.dto.subtask.SubTaskResponse;
import com.momentum.app.dto.task.TaskCreateRequest;
import com.momentum.app.dto.task.TaskResponse;
import com.momentum.app.dto.task.TaskUpdateRequest;
import com.momentum.app.entity.Category;
import com.momentum.app.entity.Task;
import com.momentum.app.entity.User;
import com.momentum.app.enums.TaskPriority;
import com.momentum.app.enums.TaskStatus;
import com.momentum.app.repository.CategoryRepository;
import com.momentum.app.repository.TaskRepository;
import com.momentum.app.repository.UserRepository;
import com.momentum.app.service.TaskService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class TaskServiceImpl implements TaskService {

    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;

    @Override
    public TaskResponse createTask(Long userId, TaskCreateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Category category = null;
        if (request.categoryId() != null) {
            category = categoryRepository.findById(request.categoryId())
                    .orElseThrow(() -> new RuntimeException("Category not found"));
        }

        Task task = Task.builder()
                .title(request.title())
                .description(request.description())
                .priority(request.priority() != null ? request.priority() : TaskPriority.MEDIUM)
                .status(TaskStatus.PENDING)
                .dueDate(request.dueDate())
                .user(user)
                .category(category)
                .build();

        return mapToResponse(taskRepository.save(task));
    }

    @Override
    public TaskResponse getTaskById(Long userId, Long taskId) {
        return mapToResponse(findTaskByIdAndUserId(taskId, userId));
    }

    @Override
    public TaskResponse updateTask(Long userId, Long taskId, TaskUpdateRequest request) {
        Task task = findTaskByIdAndUserId(taskId, userId);

        task.setTitle(request.title());
        task.setDescription(request.description());
        task.setDueDate(request.dueDate());

        if (request.status() != null) {
            if (request.status() == TaskStatus.COMPLETED && task.getStatus() != TaskStatus.COMPLETED) {
                task.setCompletedAt(LocalDateTime.now());
            } else if (request.status() != TaskStatus.COMPLETED) {
                task.setCompletedAt(null);
            }
            task.setStatus(request.status());
        }

        if (request.priority() != null) {
            task.setPriority(request.priority());
        }

        if (request.categoryId() != null) {
            Category category = categoryRepository.findById(request.categoryId())
                    .orElseThrow(() -> new RuntimeException("Category not found"));
            task.setCategory(category);
        } else {
            task.setCategory(null);
        }

        return mapToResponse(taskRepository.save(task));
    }

    @Override
    public void deleteTask(Long userId, Long taskId) {
        taskRepository.delete(findTaskByIdAndUserId(taskId, userId));
    }

    @Override
    public List<TaskResponse> getAllTasks(Long userId) {
        return taskRepository.findByUserId(userId).stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public List<TaskResponse> getTasksByStatus(Long userId, TaskStatus status) {
        return taskRepository.findByUserIdAndStatus(userId, status).stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public List<TaskResponse> getTasksByPriority(Long userId, TaskPriority priority) {
        return taskRepository.findByUserIdAndPriority(userId, priority).stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public List<TaskResponse> getTasksByCategory(Long userId, Long categoryId) {
        return taskRepository.findByUserIdAndCategoryId(userId, categoryId).stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public List<TaskResponse> getOverdueTasks(Long userId) {
        return taskRepository.findByUserIdAndDueDateBefore(userId, LocalDate.now()).stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public long countTasksByStatus(Long userId, TaskStatus status) {
        return taskRepository.countByUserIdAndStatus(userId, status);
    }

    private Task findTaskByIdAndUserId(Long taskId, Long userId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        if (!task.getUser().getId().equals(userId)) {
            throw new RuntimeException("Access denied");
        }

        return task;
    }

    private TaskResponse mapToResponse(Task task) {
        List<SubTaskResponse> subTasks = task.getSubTasks() != null
                ? task.getSubTasks().stream()
                        .map(st -> new SubTaskResponse(
                                st.getId(),
                                st.getTitle(),
                                st.isCompleted()))
                        .toList()
                : Collections.emptyList();

        return new TaskResponse(
                task.getId(),
                task.getTitle(),
                task.getDescription(),
                task.getPriority(),
                task.getStatus(),
                task.getCategory() != null ? task.getCategory().getName() : null,
                task.getDueDate(),
                task.getCreatedAt(),
                task.getUpdatedAt(),
                subTasks,
                subTasks.size(),
                (int) subTasks.stream()
                        .filter(st -> st != null && st.completed())
                        .count()
        );
    }
}