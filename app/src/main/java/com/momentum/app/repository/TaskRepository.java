package com.momentum.app.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.momentum.app.entity.Task;
import com.momentum.app.enums.TaskPriority;
import com.momentum.app.enums.TaskStatus;

public interface TaskRepository extends JpaRepository<Task, Long> {

    List<Task> findByUserId(Long userId);
    List<Task> findByUserIdAndStatus(Long userId, TaskStatus status);

    List<Task> findByUserIdAndCategoryId(Long userId, Long categoryId);

    List<Task> findByUserIdAndPriority(Long userId, TaskPriority priority);

    List<Task> findByUserIdAndDueDateBefore(Long userId, LocalDate date);

    long countByUserIdAndStatus(Long userId, TaskStatus status);
}
