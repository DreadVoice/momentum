package com.momentum.app.controller;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
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
import com.momentum.app.dto.subtask.SubTaskCreateRequest;
import com.momentum.app.dto.subtask.SubTaskResponse;
import com.momentum.app.dto.subtask.SubTaskUpdateRequest;
import com.momentum.app.exception.GlobalExceptionHandler;
import com.momentum.app.exception.ResourceNotFoundException;
import com.momentum.app.security.CustomUserDetailsService;
import com.momentum.app.security.JwtAccessDeniedHandler;
import com.momentum.app.security.JwtAuthenticationEntryPoint;
import com.momentum.app.security.UserPrincipal;
import com.momentum.app.service.JwtService;
import com.momentum.app.service.SubTaskService;

import tools.jackson.databind.ObjectMapper;

@WebMvcTest(SubTaskController.class)
@Import({ SecurityConfig.class, CorsConfig.class, GlobalExceptionHandler.class,
        JwtAuthenticationEntryPoint.class, JwtAccessDeniedHandler.class })
class SubTaskControllerTest {

    private static final String TOKEN = "a.valid.token";
    private static final Long USER_ID = 42L;

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private SubTaskService subTaskService;

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
    void createSubTask_returns201WithLocation() throws Exception {
        when(subTaskService.createSubTask(eq(USER_ID), eq(5L), any(SubTaskCreateRequest.class)))
                .thenReturn(new SubTaskResponse(20L, "Step one", false));

        mockMvc.perform(authed(post("/api/tasks/5/subtasks"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(new SubTaskCreateRequest("Step one"))))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", "/api/subtasks/20"))
                .andExpect(jsonPath("$.id").value(20))
                .andExpect(jsonPath("$.completed").value(false));
    }

    @Test
    void createSubTask_returns404ForTaskOwnedBySomeoneElse() throws Exception {
        when(subTaskService.createSubTask(eq(USER_ID), eq(99L), any(SubTaskCreateRequest.class)))
                .thenThrow(new ResourceNotFoundException("Task not found"));

        mockMvc.perform(authed(post("/api/tasks/99/subtasks"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(new SubTaskCreateRequest("Step one"))))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Task not found"));
    }

    @Test
    void createSubTask_returns400ForTitleOverFiftyCharacters() throws Exception {
        mockMvc.perform(authed(post("/api/tasks/5/subtasks"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(new SubTaskCreateRequest("x".repeat(51)))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.title").exists());

        verify(subTaskService, never()).createSubTask(any(), any(), any());
    }

    @Test
    void getSubTasks_returnsListForOwnedTask() throws Exception {
        when(subTaskService.getSubTasksByTaskId(USER_ID, 5L))
                .thenReturn(List.of(new SubTaskResponse(20L, "Step one", false),
                        new SubTaskResponse(21L, "Step two", true)));

        mockMvc.perform(authed(get("/api/tasks/5/subtasks")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[1].completed").value(true));

        verify(subTaskService).getSubTasksByTaskId(USER_ID, 5L);
    }

    @Test
    void getSubTasks_returns404ForTaskOwnedBySomeoneElse() throws Exception {
        when(subTaskService.getSubTasksByTaskId(USER_ID, 99L))
                .thenThrow(new ResourceNotFoundException("Task not found"));

        mockMvc.perform(authed(get("/api/tasks/99/subtasks")))
                .andExpect(status().isNotFound());
    }

    @Test
    void updateSubTask_returns200() throws Exception {
        when(subTaskService.updateSubTask(eq(USER_ID), eq(20L), any(SubTaskUpdateRequest.class)))
                .thenReturn(new SubTaskResponse(20L, "Renamed", true));

        mockMvc.perform(authed(put("/api/subtasks/20"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(new SubTaskUpdateRequest("Renamed", true))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Renamed"))
                .andExpect(jsonPath("$.completed").value(true));

        verify(subTaskService).updateSubTask(eq(USER_ID), eq(20L), any(SubTaskUpdateRequest.class));
    }

    @Test
    void updateSubTask_returns400ForBlankTitle() throws Exception {
        mockMvc.perform(authed(put("/api/subtasks/20"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(new SubTaskUpdateRequest(" ", false))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.title").exists());

        verify(subTaskService, never()).updateSubTask(any(), any(), any());
    }

    @Test
    void updateSubTask_returns404ForSubTaskOwnedBySomeoneElse() throws Exception {
        when(subTaskService.updateSubTask(eq(USER_ID), eq(99L), any(SubTaskUpdateRequest.class)))
                .thenThrow(new ResourceNotFoundException("SubTask not found"));

        mockMvc.perform(authed(put("/api/subtasks/99"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(new SubTaskUpdateRequest("Hacked", true))))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("SubTask not found"));
    }

    @Test
    void toggleCompletionStatus_returns200WithFlippedFlag() throws Exception {
        when(subTaskService.toggleCompletionStatus(USER_ID, 20L))
                .thenReturn(new SubTaskResponse(20L, "Step one", true));

        mockMvc.perform(authed(patch("/api/subtasks/20/toggle")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.completed").value(true));

        verify(subTaskService).toggleCompletionStatus(USER_ID, 20L);
    }

    @Test
    void toggleCompletionStatus_returns404ForSubTaskOwnedBySomeoneElse() throws Exception {
        when(subTaskService.toggleCompletionStatus(USER_ID, 99L))
                .thenThrow(new ResourceNotFoundException("SubTask not found"));

        mockMvc.perform(authed(patch("/api/subtasks/99/toggle")))
                .andExpect(status().isNotFound());
    }

    @Test
    void deleteSubTask_returns204() throws Exception {
        mockMvc.perform(authed(delete("/api/subtasks/20")))
                .andExpect(status().isNoContent());

        verify(subTaskService).deleteSubTask(USER_ID, 20L);
    }

    @Test
    void deleteSubTask_returns404ForSubTaskOwnedBySomeoneElse() throws Exception {
        doThrow(new ResourceNotFoundException("SubTask not found"))
                .when(subTaskService).deleteSubTask(USER_ID, 99L);

        mockMvc.perform(authed(delete("/api/subtasks/99")))
                .andExpect(status().isNotFound());
    }

    @Test
    void endpointsRequireAuthentication() throws Exception {
        mockMvc.perform(get("/api/tasks/5/subtasks")).andExpect(status().isUnauthorized());
        mockMvc.perform(patch("/api/subtasks/20/toggle")).andExpect(status().isUnauthorized());
        mockMvc.perform(delete("/api/subtasks/20")).andExpect(status().isUnauthorized());

        verifyNoInteractions(subTaskService);
    }
}
