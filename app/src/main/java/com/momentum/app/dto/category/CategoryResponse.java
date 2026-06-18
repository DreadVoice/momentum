package com.momentum.app.dto.category;

//GET /api/categories
public record CategoryResponse(
    Long id,
    String name,
    int taskCount
) {

}
