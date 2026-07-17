package com.momentum.app.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.momentum.app.dto.category.CategoryCreateRequest;
import com.momentum.app.dto.category.CategoryResponse;
import com.momentum.app.dto.category.CategoryUpdateRequest;
import com.momentum.app.entity.Category;
import com.momentum.app.entity.User;
import com.momentum.app.exception.ResourceAlreadyExistsException;
import com.momentum.app.exception.ResourceNotFoundException;
import com.momentum.app.repository.CategoryRepository;
import com.momentum.app.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
class CategoryServiceImplTest {

    @Mock
    private CategoryRepository categoryRepository;
    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private CategoryServiceImpl categoryService;

    private User user(Long id) {
        return User.builder().id(id).username("alice").email("a@e.com").password("h").build();
    }

    private Category category(Long id, Long ownerId, String name) {
        return Category.builder().id(id).name(name).user(user(ownerId)).build();
    }

    @Test
    void createCategory_savesAndReturnsResponse() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user(1L)));
        when(categoryRepository.existsByUserIdAndName(1L, "Work")).thenReturn(false);
        when(categoryRepository.save(any(Category.class))).thenAnswer(inv -> {
            Category c = inv.getArgument(0);
            c.setId(10L);
            return c;
        });

        CategoryResponse response = categoryService.createCategory(1L, new CategoryCreateRequest("  Work  "));

        assertThat(response.id()).isEqualTo(10L);
        assertThat(response.name()).isEqualTo("Work");
        assertThat(response.taskCount()).isZero();
    }

    @Test
    void createCategory_rejectsDuplicateName() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user(1L)));
        when(categoryRepository.existsByUserIdAndName(1L, "Work")).thenReturn(true);

        assertThatThrownBy(() -> categoryService.createCategory(1L, new CategoryCreateRequest("Work")))
                .isInstanceOf(ResourceAlreadyExistsException.class);
        verify(categoryRepository, never()).save(any());
    }

    @Test
    void createCategory_withMissingUser_throwsResourceNotFound() {
        when(userRepository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> categoryService.createCategory(1L, new CategoryCreateRequest("Work")))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void getCategories_mapsAll() {
        when(categoryRepository.findByUserId(1L))
                .thenReturn(List.of(category(1L, 1L, "Work"), category(2L, 1L, "Home")));

        List<CategoryResponse> result = categoryService.getCategories(1L);

        assertThat(result).extracting(CategoryResponse::name).containsExactly("Work", "Home");
    }

    @Test
    void getCategoryById_whenOwnedByAnotherUser_throwsResourceNotFound() {
        when(categoryRepository.findById(5L)).thenReturn(Optional.of(category(5L, 999L, "Work")));

        assertThatThrownBy(() -> categoryService.getCategoryById(1L, 5L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void getCategoryById_whenMissing_throwsResourceNotFound() {
        when(categoryRepository.findById(5L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> categoryService.getCategoryById(1L, 5L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void updateCategory_renames() {
        Category existing = category(5L, 1L, "Work");
        when(categoryRepository.findById(5L)).thenReturn(Optional.of(existing));
        when(categoryRepository.existsByUserIdAndName(1L, "Office")).thenReturn(false);
        when(categoryRepository.save(any(Category.class))).thenAnswer(inv -> inv.getArgument(0));

        CategoryResponse response = categoryService.updateCategory(1L, 5L, new CategoryUpdateRequest("Office"));

        assertThat(response.name()).isEqualTo("Office");
    }

    @Test
    void updateCategory_toDuplicateName_throwsResourceAlreadyExists() {
        Category existing = category(5L, 1L, "Work");
        when(categoryRepository.findById(5L)).thenReturn(Optional.of(existing));
        when(categoryRepository.existsByUserIdAndName(1L, "Home")).thenReturn(true);

        assertThatThrownBy(() -> categoryService.updateCategory(1L, 5L, new CategoryUpdateRequest("Home")))
                .isInstanceOf(ResourceAlreadyExistsException.class);
        verify(categoryRepository, never()).save(any());
    }

    @Test
    void updateCategory_toSameName_isAllowed() {
        Category existing = category(5L, 1L, "Work");
        when(categoryRepository.findById(5L)).thenReturn(Optional.of(existing));
        when(categoryRepository.existsByUserIdAndName(1L, "Work")).thenReturn(true);
        when(categoryRepository.save(any(Category.class))).thenAnswer(inv -> inv.getArgument(0));

        CategoryResponse response = categoryService.updateCategory(1L, 5L, new CategoryUpdateRequest("Work"));

        assertThat(response.name()).isEqualTo("Work");
    }

    @Test
    void deleteCategory_deletesOwnedCategory() {
        Category existing = category(5L, 1L, "Work");
        when(categoryRepository.findById(5L)).thenReturn(Optional.of(existing));

        categoryService.deleteCategory(1L, 5L);

        verify(categoryRepository).delete(existing);
    }

    @Test
    void deleteCategory_ofAnotherUser_throwsAndDoesNotDelete() {
        when(categoryRepository.findById(5L)).thenReturn(Optional.of(category(5L, 999L, "Work")));

        assertThatThrownBy(() -> categoryService.deleteCategory(1L, 5L))
                .isInstanceOf(ResourceNotFoundException.class);
        verify(categoryRepository, never()).delete(any());
    }
}
