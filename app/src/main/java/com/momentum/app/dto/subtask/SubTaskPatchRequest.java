package com.momentum.app.dto.subtask;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record SubTaskPatchRequest(
    @Pattern(regexp = ".*\\S.*", message = "Title cannot be blank")
    @Size(max = 50, message = "Title cannot exceed 50 characters")
    String title,
    Boolean completed
) {

}
