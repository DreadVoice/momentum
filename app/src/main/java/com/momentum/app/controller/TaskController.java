package com.momentum.app.controller;

import java.net.URI;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Stream;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.momentum.app.dto.task.TaskCreateRequest;
import com.momentum.app.dto.task.TaskPatchRequest;
import com.momentum.app.dto.task.TaskResponse;
import com.momentum.app.dto.task.TaskStatsResponse;
import com.momentum.app.dto.task.TaskUpdateRequest;
import com.momentum.app.enums.TaskPriority;
import com.momentum.app.enums.TaskStatus;
import com.momentum.app.security.UserPrincipal;
import com.momentum.app.service.TaskService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    @PostMapping
    public ResponseEntity<TaskResponse> createTask(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody TaskCreateRequest request) {
        TaskResponse created = taskService.createTask(principal.id(), request);
        return ResponseEntity.created(URI.create("/api/tasks/" + created.id())).body(created);
    }

    @GetMapping
    public ResponseEntity<List<TaskResponse>> getTasks(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) TaskStatus status,
            @RequestParam(required = false) TaskPriority priority,
            @RequestParam(required = false) Long categoryId) {

        if (Stream.of(status, priority, categoryId).filter(Objects::nonNull).count() > 1) {
            throw new IllegalArgumentException("Only one of status, priority or categoryId may be supplied");
        }

        Long userId = principal.id();
        if (status != null) {
            return ResponseEntity.ok(taskService.getTasksByStatus(userId, status));
        }
        if (priority != null) {
            return ResponseEntity.ok(taskService.getTasksByPriority(userId, priority));
        }
        if (categoryId != null) {
            return ResponseEntity.ok(taskService.getTasksByCategory(userId, categoryId));
        }
        return ResponseEntity.ok(taskService.getAllTasks(userId));
    }

    @GetMapping("/overdue")
    public ResponseEntity<List<TaskResponse>> getOverdueTasks(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(taskService.getOverdueTasks(principal.id()));
    }

    @GetMapping("/stats")
    public ResponseEntity<TaskStatsResponse> getTaskStats(
            @AuthenticationPrincipal UserPrincipal principal) {
        Map<TaskStatus, Long> countsByStatus = new EnumMap<>(TaskStatus.class);
        long total = 0;

        for (TaskStatus status : TaskStatus.values()) {
            long count = taskService.countTasksByStatus(principal.id(), status);
            countsByStatus.put(status, count);
            total += count;
        }

        return ResponseEntity.ok(new TaskStatsResponse(countsByStatus, total));
    }

    @GetMapping("/{taskId}")
    public ResponseEntity<TaskResponse> getTaskById(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long taskId) {
        return ResponseEntity.ok(taskService.getTaskById(principal.id(), taskId));
    }

    @PutMapping("/{taskId}")
    public ResponseEntity<TaskResponse> updateTask(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long taskId,
            @Valid @RequestBody TaskUpdateRequest request) {
        return ResponseEntity.ok(taskService.updateTask(principal.id(), taskId, request));
    }

    @PatchMapping("/{taskId}")
    public ResponseEntity<TaskResponse> patchTask(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long taskId,
            @Valid @RequestBody TaskPatchRequest request) {
        return ResponseEntity.ok(taskService.patchTask(principal.id(), taskId, request));
    }

    @DeleteMapping("/{taskId}")
    public ResponseEntity<Void> deleteTask(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long taskId) {
        taskService.deleteTask(principal.id(), taskId);
        return ResponseEntity.noContent().build();
    }
}
