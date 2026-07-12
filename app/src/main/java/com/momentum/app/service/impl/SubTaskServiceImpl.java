package com.momentum.app.service.impl;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;

import com.momentum.app.dto.subtask.SubTaskCreateRequest;
import com.momentum.app.dto.subtask.SubTaskResponse;
import com.momentum.app.entity.SubTask;
import com.momentum.app.entity.Task;
import com.momentum.app.repository.SubTaskRepository;
import com.momentum.app.repository.TaskRepository;
import com.momentum.app.service.SubTaskService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class SubTaskServiceImpl implements SubTaskService {

    private final SubTaskRepository subTaskRepository;
    private final TaskRepository taskRepository;

    @Override
    public SubTaskResponse createSubTask(Long taskId, SubTaskCreateRequest request) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        SubTask subTask = SubTask.builder()
                .title(request.title())
                .completed(false)
                .task(task)
                .build();

        return mapToResponse(subTaskRepository.save(subTask));
    }

    @Override
    public List<SubTaskResponse> getSubTasksByTaskId(Long taskId) {
        return subTaskRepository.findByTaskId(taskId).stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public SubTaskResponse updateSubTask(Long subTaskId, SubTaskCreateRequest request) {
        SubTask subTask = findSubTaskById(subTaskId);

        subTask.setTitle(request.title());

        return mapToResponse(subTaskRepository.save(subTask));
    }

    @Override
    public void deleteSubTask(Long subTaskId) {
        subTaskRepository.delete(findSubTaskById(subTaskId));
    }

    @Override
    public SubTaskResponse toggleCompletionStatus(Long subTaskId) {
        SubTask subTask = findSubTaskById(subTaskId);

        boolean completed = !subTask.isCompleted();
        subTask.setCompleted(completed);
        subTask.setCompletedAt(completed ? LocalDateTime.now() : null);

        return mapToResponse(subTaskRepository.save(subTask));
    }

    private SubTask findSubTaskById(Long subTaskId) {
        return subTaskRepository.findById(subTaskId)
                .orElseThrow(() -> new RuntimeException("SubTask not found"));
    }

    private SubTaskResponse mapToResponse(SubTask subTask) {
        return new SubTaskResponse(
                subTask.getId(),
                subTask.getTitle(),
                subTask.isCompleted()
        );
    }
}
