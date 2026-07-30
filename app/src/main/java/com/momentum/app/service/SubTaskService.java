package com.momentum.app.service;

import java.util.List;

import com.momentum.app.dto.subtask.SubTaskCreateRequest;
import com.momentum.app.dto.subtask.SubTaskResponse;
import com.momentum.app.dto.subtask.SubTaskUpdateRequest;

public interface SubTaskService {

    SubTaskResponse createSubTask(Long userId, Long taskId, SubTaskCreateRequest request);
    List<SubTaskResponse> getSubTasksByTaskId(Long userId, Long taskId);
    SubTaskResponse updateSubTask(Long userId, Long subTaskId, SubTaskUpdateRequest request);
    void deleteSubTask(Long userId, Long subTaskId);
    SubTaskResponse toggleCompletionStatus(Long userId, Long subTaskId);

}
