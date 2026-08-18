package com.momentum.app.dto.category;

public record CategoryResponse(
    Long id,
    String name,
    int taskCount
) {

}
