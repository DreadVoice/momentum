package com.momentum.app.dto.category;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CategoryPatchRequest(
    @Pattern(regexp = ".*\\S.*", message = "Category name cannot be blank")
    @Size(max = 255, message = "Category name cannot exceed 255 characters")
    String name
) {

}
