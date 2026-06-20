package com.momentum.app.service.impl;

import java.util.List;

import com.momentum.app.dto.subtask.SubTaskCreateRequest;
import com.momentum.app.dto.subtask.SubTaskResponse;
import com.momentum.app.service.SubTaskService;

public class SubTaskServiceImpl implements SubTaskService {

    @Override
    public SubTaskResponse createSubTask(Long taskId, SubTaskCreateRequest request) {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'createSubTask'");
    }

    @Override
    public List<SubTaskResponse> getSubTasksByTaskId(Long taskId) {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'getSubTasksByTaskId'");
    }

    @Override
    public SubTaskResponse updateSubTask(Long subTaskId, SubTaskCreateRequest request) {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'updateSubTask'");
    }

    @Override
    public void deleteSubTask(Long subTaskId) {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'deleteSubTask'");
    }

    @Override
    public SubTaskResponse toggleCompletionStatus(Long subTaskId) {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'toggleCompletionStatus'");
    }

}
