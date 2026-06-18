package com.momentum.app.dto.subtask;

public record SubTaskResponse(
    Long id,
    String title,
    boolean completed
) {

}
