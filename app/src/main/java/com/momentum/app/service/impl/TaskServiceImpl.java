package com.momentum.app.service.impl;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.momentum.app.dto.subtask.SubTaskResponse;
import com.momentum.app.dto.task.TaskCreateRequest;
import com.momentum.app.dto.task.TaskPatchRequest;
import com.momentum.app.dto.task.TaskResponse;
import com.momentum.app.dto.task.TaskUpdateRequest;
import com.momentum.app.entity.Category;
import com.momentum.app.entity.Task;
import com.momentum.app.entity.User;
import com.momentum.app.enums.TaskPriority;
import com.momentum.app.enums.TaskStatus;
import com.momentum.app.exception.ResourceNotFoundException;
import com.momentum.app.repository.CategoryRepository;
import com.momentum.app.repository.TaskRepository;
import com.momentum.app.repository.UserRepository;
import com.momentum.app.service.TaskService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class TaskServiceImpl implements TaskService {

    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;

    @Override
    public TaskResponse createTask(Long userId, TaskCreateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Category category = request.categoryId() != null
                ? findCategory(userId, request.categoryId())
                : null;

        Task task = Task.builder()
                .title(request.title())
                .description(request.description())
                .priority(request.priority() != null ? request.priority() : TaskPriority.MEDIUM)
                .status(TaskStatus.PENDING)
                .dueDate(request.dueDate())
                .user(user)
                .category(category)
                .build();

        return toResponse(taskRepository.save(task));
    }

    @Override
    @Transactional(readOnly = true)
    public TaskResponse getTaskById(Long userId, Long taskId) {
        return toResponse(findTask(userId, taskId));
    }

    @Override
    public TaskResponse updateTask(Long userId, Long taskId, TaskUpdateRequest request) {
        Task task = findTask(userId, taskId);

        task.setTitle(request.title());
        task.setDescription(request.description());
        task.setDueDate(request.dueDate());

        if (request.status() != null) {
            applyStatus(task, request.status());
        }

        if (request.priority() != null) {
            task.setPriority(request.priority());
        }

        task.setCategory(request.categoryId() != null
                ? findCategory(userId, request.categoryId())
                : null);

        return toResponse(taskRepository.save(task));
    }

    @Override
    public TaskResponse patchTask(Long userId, Long taskId, TaskPatchRequest request) {
        Task task = findTask(userId, taskId);

        if (request.title() != null) {
            task.setTitle(request.title());
        }
        if (request.description() != null) {
            task.setDescription(request.description());
        }
        if (request.priority() != null) {
            task.setPriority(request.priority());
        }
        if (request.status() != null) {
            applyStatus(task, request.status());
        }
        if (request.dueDate() != null) {
            task.setDueDate(request.dueDate());
        }
        if (request.categoryId() != null) {
            task.setCategory(findCategory(userId, request.categoryId()));
        }

        return toResponse(taskRepository.save(task));
    }

    private void applyStatus(Task task, TaskStatus status) {
        if (status == TaskStatus.COMPLETED && task.getStatus() != TaskStatus.COMPLETED) {
            task.setCompletedAt(LocalDateTime.now());
        } else if (status != TaskStatus.COMPLETED) {
            task.setCompletedAt(null);
        }
        task.setStatus(status);
    }

    @Override
    public void deleteTask(Long userId, Long taskId) {
        taskRepository.delete(findTask(userId, taskId));
    }

    @Override
    @Transactional(readOnly = true)
    public List<TaskResponse> getAllTasks(Long userId) {
        return taskRepository.findByUserId(userId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<TaskResponse> getTasksByStatus(Long userId, TaskStatus status) {
        return taskRepository.findByUserIdAndStatus(userId, status).stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<TaskResponse> getTasksByPriority(Long userId, TaskPriority priority) {
        return taskRepository.findByUserIdAndPriority(userId, priority).stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<TaskResponse> getTasksByCategory(Long userId, Long categoryId) {
        return taskRepository.findByUserIdAndCategoryId(userId, categoryId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<TaskResponse> getOverdueTasks(Long userId) {
        return taskRepository.findByUserIdAndDueDateBefore(userId, LocalDate.now()).stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public long countTasksByStatus(Long userId, TaskStatus status) {
        return taskRepository.countByUserIdAndStatus(userId, status);
    }

    private Task findTask(Long userId, Long taskId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));

        if (!task.getUser().getId().equals(userId)) {
            throw new ResourceNotFoundException("Task not found");
        }

        return task;
    }

    private Category findCategory(Long userId, Long categoryId) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));

        if (!category.getUser().getId().equals(userId)) {
            throw new ResourceNotFoundException("Category not found");
        }

        return category;
    }

    private TaskResponse toResponse(Task task) {
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
                        .filter(SubTaskResponse::completed)
                        .count()
        );
    }
}