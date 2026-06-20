package com.momentum.app.service;

import java.util.List;

import com.momentum.app.dto.subtask.SubTaskCreateRequest;
import com.momentum.app.dto.subtask.SubTaskResponse;

public interface SubTaskService {

    SubTaskResponse createSubTask(Long taskId, SubTaskCreateRequest request);
    List<SubTaskResponse> getSubTasksByTaskId(Long taskId);
    SubTaskResponse updateSubTask(Long subTaskId, SubTaskCreateRequest request);
    void deleteSubTask(Long subTaskId);
    SubTaskResponse toggleCompletionStatus(Long subTaskId);

}
