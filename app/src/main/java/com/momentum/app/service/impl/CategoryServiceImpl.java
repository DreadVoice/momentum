package com.momentum.app.service.impl;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.momentum.app.dto.category.CategoryCreateRequest;
import com.momentum.app.dto.category.CategoryPatchRequest;
import com.momentum.app.dto.category.CategoryResponse;
import com.momentum.app.dto.category.CategoryUpdateRequest;
import com.momentum.app.entity.Category;
import com.momentum.app.entity.User;
import com.momentum.app.exception.ResourceAlreadyExistsException;
import com.momentum.app.exception.ResourceNotFoundException;
import com.momentum.app.repository.CategoryRepository;
import com.momentum.app.repository.UserRepository;
import com.momentum.app.service.CategoryService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;

    private Category findCategory(Long userId, Long categoryId) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
        if (!category.getUser().getId().equals(userId)) {
            throw new ResourceNotFoundException("Category not found");
        }
        return category;
    }

    @Override
    public CategoryResponse createCategory(Long userId, CategoryCreateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        String normalizedName = request.name().trim();

        if (categoryRepository.existsByUserIdAndName(userId, normalizedName)) {
            throw new ResourceAlreadyExistsException("Category already exists");
        }

        Category category = Category.builder()
                .name(normalizedName)
                .user(user)
                .build();

        return toResponse(categoryRepository.save(category));
    }

    @Override
    @Transactional(readOnly = true)
    public List<CategoryResponse> getCategories(Long userId) {
        return categoryRepository.findByUserId(userId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public CategoryResponse getCategoryById(Long userId, Long categoryId) {
        return toResponse(findCategory(userId, categoryId));
    }

    @Override
    public CategoryResponse updateCategory(Long userId, Long categoryId, CategoryUpdateRequest request) {
        Category category = findCategory(userId, categoryId);

        rename(category, userId, request.name());

        return toResponse(categoryRepository.save(category));
    }

    @Override
    public CategoryResponse patchCategory(Long userId, Long categoryId, CategoryPatchRequest request) {
        Category category = findCategory(userId, categoryId);

        if (request.name() != null) {
            rename(category, userId, request.name());
        }

        return toResponse(categoryRepository.save(category));
    }

    private void rename(Category category, Long userId, String name) {
        String normalizedName = name.trim();

        if (categoryRepository.existsByUserIdAndName(userId, normalizedName)
                && !category.getName().equals(normalizedName)) {
            throw new ResourceAlreadyExistsException("Category already exists");
        }

        category.setName(normalizedName);
    }

    @Override
    public void deleteCategory(Long userId, Long categoryId) {
        Category category = findCategory(userId, categoryId);

        if (category.getTasks() != null) {
            category.getTasks().forEach(task -> task.setCategory(null));
        }

        categoryRepository.delete(category);
    }

    private CategoryResponse toResponse(Category category) {
        int taskCount = category.getTasks() == null ? 0 : category.getTasks().size();
        return new CategoryResponse(category.getId(), category.getName(), taskCount);
    }

}
