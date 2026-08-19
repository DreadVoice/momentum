package com.momentum.app.controller;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import com.momentum.app.config.CorsConfig;
import com.momentum.app.config.SecurityConfig;
import com.momentum.app.dto.category.CategoryCreateRequest;
import com.momentum.app.dto.category.CategoryResponse;
import com.momentum.app.dto.category.CategoryUpdateRequest;
import com.momentum.app.exception.GlobalExceptionHandler;
import com.momentum.app.exception.ResourceAlreadyExistsException;
import com.momentum.app.exception.ResourceNotFoundException;
import com.momentum.app.security.CustomUserDetailsService;
import com.momentum.app.security.JwtAccessDeniedHandler;
import com.momentum.app.security.JwtAuthenticationEntryPoint;
import com.momentum.app.security.RateLimitFilter;
import com.momentum.app.security.UserPrincipal;
import com.momentum.app.service.CategoryService;
import com.momentum.app.service.JwtService;

import tools.jackson.databind.ObjectMapper;

@WebMvcTest(CategoryController.class)
@Import({ SecurityConfig.class, CorsConfig.class, GlobalExceptionHandler.class,
        JwtAuthenticationEntryPoint.class, JwtAccessDeniedHandler.class, RateLimitFilter.class })
class CategoryControllerTest {

    private static final String TOKEN = "a.valid.token";
    private static final Long USER_ID = 42L;

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private CategoryService categoryService;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private CustomUserDetailsService userDetailsService;

    @BeforeEach
    @SuppressWarnings("unused")
    void authenticateAsUser() {
        when(jwtService.isAccessToken(TOKEN)).thenReturn(true);
        when(jwtService.extractUserId(TOKEN)).thenReturn(USER_ID);
        when(userDetailsService.loadUserById(USER_ID))
                .thenReturn(new UserPrincipal(USER_ID, "alice", "hash"));
    }

    private MockHttpServletRequestBuilder authed(MockHttpServletRequestBuilder builder) {
        return builder.header("Authorization", "Bearer " + TOKEN);
    }

    private String json(Object body) {
        return objectMapper.writeValueAsString(body);
    }

    @Test
    void createCategory_returns201WithLocation() throws Exception {
        when(categoryService.createCategory(eq(USER_ID), any(CategoryCreateRequest.class)))
                .thenReturn(new CategoryResponse(10L, "Work", 0));

        mockMvc.perform(authed(post("/api/categories"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(new CategoryCreateRequest("Work"))))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", "/api/categories/10"))
                .andExpect(jsonPath("$.id").value(10))
                .andExpect(jsonPath("$.name").value("Work"))
                .andExpect(jsonPath("$.taskCount").value(0));
    }

    @Test
    void createCategory_returns400ForBlankName() throws Exception {
        mockMvc.perform(authed(post("/api/categories"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(new CategoryCreateRequest(" "))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.name").exists());

        verify(categoryService, never()).createCategory(any(), any());
    }

    @Test
    void createCategory_returns409ForDuplicateName() throws Exception {
        when(categoryService.createCategory(eq(USER_ID), any(CategoryCreateRequest.class)))
                .thenThrow(new ResourceAlreadyExistsException("Category already exists"));

        mockMvc.perform(authed(post("/api/categories"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(new CategoryCreateRequest("Work"))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Category already exists"));
    }

    @Test
    void getCategories_returnsOnlyCallersCategories() throws Exception {
        when(categoryService.getCategories(USER_ID))
                .thenReturn(List.of(new CategoryResponse(10L, "Work", 3), new CategoryResponse(11L, "Home", 0)));

        mockMvc.perform(authed(get("/api/categories")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].name").value("Work"));

        verify(categoryService).getCategories(USER_ID);
    }

    @Test
    void getCategoryById_returnsCategory() throws Exception {
        when(categoryService.getCategoryById(USER_ID, 10L)).thenReturn(new CategoryResponse(10L, "Work", 3));

        mockMvc.perform(authed(get("/api/categories/10")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.taskCount").value(3));
    }

    @Test
    void getCategoryById_returns404ForCategoryOwnedBySomeoneElse() throws Exception {
        when(categoryService.getCategoryById(USER_ID, 99L))
                .thenThrow(new ResourceNotFoundException("Category not found"));

        mockMvc.perform(authed(get("/api/categories/99")))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Category not found"));
    }

    @Test
    void updateCategory_returns200() throws Exception {
        when(categoryService.updateCategory(eq(USER_ID), eq(10L), any(CategoryUpdateRequest.class)))
                .thenReturn(new CategoryResponse(10L, "Renamed", 3));

        mockMvc.perform(authed(put("/api/categories/10"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(new CategoryUpdateRequest("Renamed"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Renamed"));

        verify(categoryService).updateCategory(eq(USER_ID), eq(10L), any(CategoryUpdateRequest.class));
    }

    @Test
    void updateCategory_returns400ForBlankName() throws Exception {
        mockMvc.perform(authed(put("/api/categories/10"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(new CategoryUpdateRequest(""))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.name").exists());

        verify(categoryService, never()).updateCategory(any(), any(), any());
    }

    @Test
    void deleteCategory_returns204() throws Exception {
        mockMvc.perform(authed(delete("/api/categories/10")))
                .andExpect(status().isNoContent());

        verify(categoryService).deleteCategory(USER_ID, 10L);
    }

    @Test
    void deleteCategory_returns404ForCategoryOwnedBySomeoneElse() throws Exception {
        doThrow(new ResourceNotFoundException("Category not found"))
                .when(categoryService).deleteCategory(USER_ID, 99L);

        mockMvc.perform(authed(delete("/api/categories/99")))
                .andExpect(status().isNotFound());
    }

    @Test
    void endpointsRequireAuthentication() throws Exception {
        mockMvc.perform(get("/api/categories")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/categories/10")).andExpect(status().isUnauthorized());
        mockMvc.perform(delete("/api/categories/10")).andExpect(status().isUnauthorized());

        verify(categoryService, never()).getCategories(any());
        verify(categoryService, never()).getCategoryById(any(), any());
        verify(categoryService, never()).deleteCategory(any(), any());
    }
}
