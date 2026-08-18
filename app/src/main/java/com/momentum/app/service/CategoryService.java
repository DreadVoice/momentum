package com.momentum.app.service;

import java.util.List;

import com.momentum.app.dto.category.CategoryCreateRequest;
import com.momentum.app.dto.category.CategoryPatchRequest;
import com.momentum.app.dto.category.CategoryResponse;
import com.momentum.app.dto.category.CategoryUpdateRequest;

public interface CategoryService {
    CategoryResponse createCategory(Long userId, CategoryCreateRequest request);
    List<CategoryResponse> getCategories(Long userId);
    CategoryResponse getCategoryById(Long userId, Long categoryId);
    CategoryResponse updateCategory(Long userId, Long categoryId, CategoryUpdateRequest request);
    CategoryResponse patchCategory(Long userId, Long categoryId, CategoryPatchRequest request);
    void deleteCategory(Long userId, Long categoryId);
}
