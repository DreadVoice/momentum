package com.momentum.app.controller;

import java.net.URI;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.momentum.app.dto.category.CategoryCreateRequest;
import com.momentum.app.dto.category.CategoryResponse;
import com.momentum.app.dto.category.CategoryUpdateRequest;
import com.momentum.app.security.UserPrincipal;
import com.momentum.app.service.CategoryService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    @PostMapping
    public ResponseEntity<CategoryResponse> createCategory(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CategoryCreateRequest request) {
        CategoryResponse created = categoryService.createCategory(principal.id(), request);
        return ResponseEntity.created(URI.create("/api/categories/" + created.id())).body(created);
    }

    @GetMapping
    public ResponseEntity<List<CategoryResponse>> getCategories(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(categoryService.getCategories(principal.id()));
    }

    @GetMapping("/{categoryId}")
    public ResponseEntity<CategoryResponse> getCategoryById(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long categoryId) {
        return ResponseEntity.ok(categoryService.getCategoryById(principal.id(), categoryId));
    }

    @PutMapping("/{categoryId}")
    public ResponseEntity<CategoryResponse> updateCategory(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long categoryId,
            @Valid @RequestBody CategoryUpdateRequest request) {
        return ResponseEntity.ok(categoryService.updateCategory(principal.id(), categoryId, request));
    }

    @DeleteMapping("/{categoryId}")
    public ResponseEntity<Void> deleteCategory(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long categoryId) {
        categoryService.deleteCategory(principal.id(), categoryId);
        return ResponseEntity.noContent().build();
    }
}
