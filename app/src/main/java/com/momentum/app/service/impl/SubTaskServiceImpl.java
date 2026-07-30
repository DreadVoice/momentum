package com.momentum.app.service.impl;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;

import com.momentum.app.dto.subtask.SubTaskCreateRequest;
import com.momentum.app.dto.subtask.SubTaskResponse;
import com.momentum.app.dto.subtask.SubTaskUpdateRequest;
import com.momentum.app.entity.SubTask;
import com.momentum.app.entity.Task;
import com.momentum.app.exception.ResourceNotFoundException;
import com.momentum.app.repository.SubTaskRepository;
import com.momentum.app.repository.TaskRepository;
import com.momentum.app.service.SubTaskService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class SubTaskServiceImpl implements SubTaskService {

    private final SubTaskRepository subTaskRepository;
    private final TaskRepository taskRepository;

    private Task findTask(Long userId, Long taskId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));
        if (!task.getUser().getId().equals(userId)) {
            throw new ResourceNotFoundException("Task not found");
        }
        return task;
    }

    private SubTask findSubTask(Long userId, Long subTaskId) {
        SubTask subTask = subTaskRepository.findById(subTaskId)
                .orElseThrow(() -> new ResourceNotFoundException("SubTask not found"));
        if (!subTask.getTask().getUser().getId().equals(userId)) {
            throw new ResourceNotFoundException("SubTask not found");
        }
        return subTask;
    }

    @Override
    public SubTaskResponse createSubTask(Long userId, Long taskId, SubTaskCreateRequest request) {
        Task task = findTask(userId, taskId);

        SubTask subTask = SubTask.builder()
                .title(request.title())
                .completed(false)
                .task(task)
                .build();

        return mapToResponse(subTaskRepository.save(subTask));
    }

    @Override
    public List<SubTaskResponse> getSubTasksByTaskId(Long userId, Long taskId) {
        findTask(userId, taskId);

        return subTaskRepository.findByTaskId(taskId).stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public SubTaskResponse updateSubTask(Long userId, Long subTaskId, SubTaskUpdateRequest request) {
        SubTask subTask = findSubTask(userId, subTaskId);

        subTask.setTitle(request.title());
        applyCompletion(subTask, request.completed());

        return mapToResponse(subTaskRepository.save(subTask));
    }

    @Override
    public void deleteSubTask(Long userId, Long subTaskId) {
        subTaskRepository.delete(findSubTask(userId, subTaskId));
    }

    @Override
    public SubTaskResponse toggleCompletionStatus(Long userId, Long subTaskId) {
        SubTask subTask = findSubTask(userId, subTaskId);

        applyCompletion(subTask, !subTask.isCompleted());

        return mapToResponse(subTaskRepository.save(subTask));
    }

    private void applyCompletion(SubTask subTask, boolean completed) {
        if (completed == subTask.isCompleted()) {
            return;
        }
        subTask.setCompleted(completed);
        subTask.setCompletedAt(completed ? LocalDateTime.now() : null);
    }

    private SubTaskResponse mapToResponse(SubTask subTask) {
        return new SubTaskResponse(
                subTask.getId(),
                subTask.getTitle(),
                subTask.isCompleted()
        );
    }
}
