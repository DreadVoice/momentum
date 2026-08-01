package com.momentum.app.dto.task;

import java.util.Map;

import com.momentum.app.enums.TaskStatus;

// GET /api/tasks/stats
public record TaskStatsResponse(
    Map<TaskStatus, Long> countsByStatus,
    long total
) {

}
