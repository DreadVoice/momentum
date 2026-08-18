package com.momentum.app.service.impl;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.momentum.app.dto.subtask.SubTaskCreateRequest;
import com.momentum.app.dto.subtask.SubTaskResponse;
import com.momentum.app.dto.subtask.SubTaskUpdateRequest;
import com.momentum.app.entity.SubTask;
import com.momentum.app.entity.Task;
import com.momentum.app.entity.User;
import com.momentum.app.exception.ResourceNotFoundException;
import com.momentum.app.repository.SubTaskRepository;
import com.momentum.app.repository.TaskRepository;

@ExtendWith(MockitoExtension.class)
class SubTaskServiceImplTest {

    private static final Long OWNER = 1L;
    private static final Long INTRUDER = 2L;

    @Mock
    private SubTaskRepository subTaskRepository;
    @Mock
    private TaskRepository taskRepository;

    @InjectMocks
    private SubTaskServiceImpl subTaskService;

    private Task task(Long id, Long ownerId) {
        User user = User.builder().id(ownerId).username("alice").email("a@e.com").password("h").build();
        return Task.builder().id(id).title("Task").user(user).build();
    }

    private SubTask subTask(Long id, Long ownerId, boolean completed) {
        return SubTask.builder().id(id).title("Step").completed(completed).task(task(5L, ownerId)).build();
    }

    @Test
    void createSubTask_savesAgainstOwnedTask() {
        when(taskRepository.findById(5L)).thenReturn(Optional.of(task(5L, OWNER)));
        when(subTaskRepository.save(any(SubTask.class))).thenAnswer(inv -> {
            SubTask s = inv.getArgument(0);
            s.setId(20L);
            return s;
        });

        SubTaskResponse response = subTaskService.createSubTask(OWNER, 5L, new SubTaskCreateRequest("Step"));

        assertThat(response.id()).isEqualTo(20L);
        assertThat(response.completed()).isFalse();
    }

    @Test
    void createSubTask_rejectsTaskOwnedBySomeoneElse() {
        when(taskRepository.findById(5L)).thenReturn(Optional.of(task(5L, OWNER)));

        assertThatThrownBy(() -> subTaskService.createSubTask(INTRUDER, 5L, new SubTaskCreateRequest("Step")))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Task not found");

        verify(subTaskRepository, never()).save(any(SubTask.class));
    }

    @Test
    void getSubTasksByTaskId_rejectsTaskOwnedBySomeoneElse() {
        when(taskRepository.findById(5L)).thenReturn(Optional.of(task(5L, OWNER)));

        assertThatThrownBy(() -> subTaskService.getSubTasksByTaskId(INTRUDER, 5L))
                .isInstanceOf(ResourceNotFoundException.class);

        verify(subTaskRepository, never()).findByTaskId(5L);
    }

    @Test
    void getSubTasksByTaskId_returnsSubTasksForOwner() {
        when(taskRepository.findById(5L)).thenReturn(Optional.of(task(5L, OWNER)));
        when(subTaskRepository.findByTaskId(5L)).thenReturn(List.of(subTask(20L, OWNER, false)));

        assertThat(subTaskService.getSubTasksByTaskId(OWNER, 5L)).hasSize(1);
    }

    @Test
    void updateSubTask_appliesTitleAndCompletion() {
        SubTask existing = subTask(20L, OWNER, false);
        when(subTaskRepository.findById(20L)).thenReturn(Optional.of(existing));
        when(subTaskRepository.save(any(SubTask.class))).thenAnswer(inv -> inv.getArgument(0));

        SubTaskResponse response = subTaskService.updateSubTask(
                OWNER, 20L, new SubTaskUpdateRequest("Renamed", true));

        assertThat(response.title()).isEqualTo("Renamed");
        assertThat(response.completed()).isTrue();
        assertThat(existing.getCompletedAt()).isNotNull();
    }

    @Test
    void updateSubTask_rejectsSubTaskOwnedBySomeoneElse() {
        when(subTaskRepository.findById(20L)).thenReturn(Optional.of(subTask(20L, OWNER, false)));

        assertThatThrownBy(() -> subTaskService.updateSubTask(
                INTRUDER, 20L, new SubTaskUpdateRequest("Hacked", true)))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("SubTask not found");

        verify(subTaskRepository, never()).save(any(SubTask.class));
    }

    @Test
    void deleteSubTask_rejectsSubTaskOwnedBySomeoneElse() {
        when(subTaskRepository.findById(20L)).thenReturn(Optional.of(subTask(20L, OWNER, false)));

        assertThatThrownBy(() -> subTaskService.deleteSubTask(INTRUDER, 20L))
                .isInstanceOf(ResourceNotFoundException.class);

        verify(subTaskRepository, never()).delete(any(SubTask.class));
    }

    @Test
    void toggleCompletionStatus_flipsAndStampsCompletedAt() {
        SubTask existing = subTask(20L, OWNER, false);
        when(subTaskRepository.findById(20L)).thenReturn(Optional.of(existing));
        when(subTaskRepository.save(any(SubTask.class))).thenAnswer(inv -> inv.getArgument(0));

        assertThat(subTaskService.toggleCompletionStatus(OWNER, 20L).completed()).isTrue();
        assertThat(existing.getCompletedAt()).isNotNull();

        assertThat(subTaskService.toggleCompletionStatus(OWNER, 20L).completed()).isFalse();
        assertThat(existing.getCompletedAt()).isNull();
    }

    @Test
    void toggleCompletionStatus_rejectsSubTaskOwnedBySomeoneElse() {
        when(subTaskRepository.findById(20L)).thenReturn(Optional.of(subTask(20L, OWNER, false)));

        assertThatThrownBy(() -> subTaskService.toggleCompletionStatus(INTRUDER, 20L))
                .isInstanceOf(ResourceNotFoundException.class);

        verify(subTaskRepository, never()).save(any(SubTask.class));
    }

    @Test
    void findSubTask_reportsNotFoundForMissingId() {
        when(subTaskRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> subTaskService.deleteSubTask(OWNER, 99L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("SubTask not found");
    }
}
