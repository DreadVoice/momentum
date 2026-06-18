package com.momentum.app.dto.category;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

//POST /api/categories
public record CategoryCreateRequest(
    @NotBlank(message = "Category name is required")
    @Size(max = 255, message = "Category name cannot exceed 255 characters")
    String name
) {

}
