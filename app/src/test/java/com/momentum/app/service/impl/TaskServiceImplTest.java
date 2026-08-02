package com.momentum.app.service.impl;

import java.time.LocalDate;
import java.util.Optional;

import com.momentum.app.dto.task.TaskPatchRequest;
import com.momentum.app.enums.TaskPriority;
import com.momentum.app.enums.TaskStatus;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;

import com.momentum.app.dto.task.TaskCreateRequest;
import com.momentum.app.dto.task.TaskUpdateRequest;
import com.momentum.app.entity.Category;
import com.momentum.app.entity.Task;
import com.momentum.app.entity.User;
import com.momentum.app.exception.ResourceNotFoundException;
import com.momentum.app.repository.CategoryRepository;
import com.momentum.app.repository.TaskRepository;
import com.momentum.app.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
class TaskServiceImplTest {

    private static final Long OWNER = 1L;
    private static final Long INTRUDER = 2L;

    @Mock
    private TaskRepository taskRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private CategoryRepository categoryRepository;

    @InjectMocks
    private TaskServiceImpl taskService;

    private User user(Long id) {
        return User.builder().id(id).username("alice").email("a@e.com").password("h").build();
    }

    private Task task(Long id, Long ownerId) {
        return Task.builder().id(id).title("Task").user(user(ownerId)).build();
    }

    private Category category(Long id, Long ownerId) {
        return Category.builder().id(id).name("Work").user(user(ownerId)).build();
    }

    @Test
    void getTaskById_rejectsTaskOwnedBySomeoneElse() {
        when(taskRepository.findById(5L)).thenReturn(Optional.of(task(5L, OWNER)));

        assertThatThrownBy(() -> taskService.getTaskById(INTRUDER, 5L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Task not found");
    }

    @Test
    void getTaskById_reportsNotFoundForMissingId() {
        when(taskRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> taskService.getTaskById(OWNER, 99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void deleteTask_rejectsTaskOwnedBySomeoneElse() {
        when(taskRepository.findById(5L)).thenReturn(Optional.of(task(5L, OWNER)));

        assertThatThrownBy(() -> taskService.deleteTask(INTRUDER, 5L))
                .isInstanceOf(ResourceNotFoundException.class);

        verify(taskRepository, never()).delete(any(Task.class));
    }

    @Test
    void createTask_rejectsCategoryOwnedBySomeoneElse() {
        when(userRepository.findById(INTRUDER)).thenReturn(Optional.of(user(INTRUDER)));
        when(categoryRepository.findById(7L)).thenReturn(Optional.of(category(7L, OWNER)));

        TaskCreateRequest request = new TaskCreateRequest("Task", null, null, 7L, null);

        assertThatThrownBy(() -> taskService.createTask(INTRUDER, request))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Category not found");

        verify(taskRepository, never()).save(any(Task.class));
    }

    @Test
    void createTask_attachesOwnCategory() {
        when(userRepository.findById(OWNER)).thenReturn(Optional.of(user(OWNER)));
        when(categoryRepository.findById(7L)).thenReturn(Optional.of(category(7L, OWNER)));
        when(taskRepository.save(any(Task.class))).thenAnswer(inv -> {
            Task t = inv.getArgument(0);
            t.setId(30L);
            return t;
        });

        var response = taskService.createTask(OWNER, new TaskCreateRequest("Task", null, null, 7L, null));

        assertThat(response.id()).isEqualTo(30L);
        assertThat(response.categoryName()).isEqualTo("Work");
    }

    @Test
    void patchTask_changesOnlyTheSuppliedFields() {
        Task existing = task(5L, OWNER);
        existing.setDescription("original description");
        existing.setPriority(TaskPriority.LOW);
        when(taskRepository.findById(5L)).thenReturn(Optional.of(existing));
        when(taskRepository.save(any(Task.class))).thenAnswer(inv -> inv.getArgument(0));

        TaskPatchRequest request = new TaskPatchRequest(null, null, null, TaskStatus.COMPLETED, null, null);

        taskService.patchTask(OWNER, 5L, request);

        assertThat(existing.getStatus()).isEqualTo(TaskStatus.COMPLETED);
        assertThat(existing.getCompletedAt()).isNotNull();
        assertThat(existing.getTitle()).isEqualTo("Task");
        assertThat(existing.getDescription()).isEqualTo("original description");
        assertThat(existing.getPriority()).isEqualTo(TaskPriority.LOW);
    }

    @Test
    void patchTask_rejectsTaskOwnedBySomeoneElse() {
        when(taskRepository.findById(5L)).thenReturn(Optional.of(task(5L, OWNER)));

        assertThatThrownBy(() -> taskService.patchTask(INTRUDER, 5L, new TaskPatchRequest(null, null, null, null, null, null)))
                .isInstanceOf(ResourceNotFoundException.class);

        verify(taskRepository, never()).save(any(Task.class));
    }

    @Test
    void patchTask_rejectsCategoryOwnedBySomeoneElse() {
        when(taskRepository.findById(5L)).thenReturn(Optional.of(task(5L, OWNER)));
        when(categoryRepository.findById(7L)).thenReturn(Optional.of(category(7L, INTRUDER)));

        TaskPatchRequest request = new TaskPatchRequest(null, null, null, null, 7L, null);

        assertThatThrownBy(() -> taskService.patchTask(OWNER, 5L, request))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Category not found");
    }

    @Test
    void updateTask_rejectsCategoryOwnedBySomeoneElse() {
        Task existing = task(5L, OWNER);
        when(taskRepository.findById(5L)).thenReturn(Optional.of(existing));
        when(categoryRepository.findById(7L)).thenReturn(Optional.of(category(7L, INTRUDER)));

        TaskUpdateRequest request = new TaskUpdateRequest("Task", null, null, null, 7L, null);

        assertThatThrownBy(() -> taskService.updateTask(OWNER, 5L, request))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Category not found");

        verify(taskRepository, never()).save(any(Task.class));
    }
}
