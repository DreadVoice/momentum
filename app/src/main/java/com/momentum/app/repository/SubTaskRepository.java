package com.momentum.app.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.momentum.app.entity.SubTask;

public interface SubTaskRepository extends JpaRepository<SubTask, Long> {

    List<SubTask> findByTaskId(Long taskId);
    long countByTaskId(Long taskId);
    long countByTaskIdAndCompletedTrue(Long taskId);

}
