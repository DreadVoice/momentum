package com.momentum.app.controller;

import java.net.URI;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.momentum.app.dto.subtask.SubTaskCreateRequest;
import com.momentum.app.dto.subtask.SubTaskResponse;
import com.momentum.app.dto.subtask.SubTaskUpdateRequest;
import com.momentum.app.security.UserPrincipal;
import com.momentum.app.service.SubTaskService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
public class SubTaskController {

    private final SubTaskService subTaskService;

    @PostMapping("/api/tasks/{taskId}/subtasks")
    public ResponseEntity<SubTaskResponse> createSubTask(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long taskId,
            @Valid @RequestBody SubTaskCreateRequest request) {
        SubTaskResponse created = subTaskService.createSubTask(principal.id(), taskId, request);
        return ResponseEntity.created(URI.create("/api/subtasks/" + created.id())).body(created);
    }

    @GetMapping("/api/tasks/{taskId}/subtasks")
    public ResponseEntity<List<SubTaskResponse>> getSubTasks(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long taskId) {
        return ResponseEntity.ok(subTaskService.getSubTasksByTaskId(principal.id(), taskId));
    }

    @PutMapping("/api/subtasks/{subTaskId}")
    public ResponseEntity<SubTaskResponse> updateSubTask(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long subTaskId,
            @Valid @RequestBody SubTaskUpdateRequest request) {
        return ResponseEntity.ok(subTaskService.updateSubTask(principal.id(), subTaskId, request));
    }

    @PatchMapping("/api/subtasks/{subTaskId}/toggle")
    public ResponseEntity<SubTaskResponse> toggleCompletionStatus(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long subTaskId) {
        return ResponseEntity.ok(subTaskService.toggleCompletionStatus(principal.id(), subTaskId));
    }

    @DeleteMapping("/api/subtasks/{subTaskId}")
    public ResponseEntity<Void> deleteSubTask(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long subTaskId) {
        subTaskService.deleteSubTask(principal.id(), subTaskId);
        return ResponseEntity.noContent().build();
    }
}
