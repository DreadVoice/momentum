package com.momentum.app.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.momentum.app.entity.Task;
import com.momentum.app.enums.TaskPriority;
import com.momentum.app.enums.TaskStatus;

public interface TaskRepository extends JpaRepository<Task, Long> {

    List<Task> findByUserIdAndDueDateBefore(Long userId, LocalDate date);

    @Query("select t from Task t where t.user.id = :userId "
            + "and (:status is null or t.status = :status) "
            + "and (:priority is null or t.priority = :priority) "
            + "and (:categoryId is null or t.category.id = :categoryId)")
    Page<Task> findFiltered(@Param("userId") Long userId,
            @Param("status") TaskStatus status,
            @Param("priority") TaskPriority priority,
            @Param("categoryId") Long categoryId,
            Pageable pageable);

    long countByUserIdAndStatus(Long userId, TaskStatus status);
}
