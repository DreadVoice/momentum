package com.momentum.app.controller;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import com.momentum.app.config.CorsConfig;
import com.momentum.app.config.SecurityConfig;
import com.momentum.app.dto.task.TaskPatchRequest;
import com.momentum.app.dto.task.TaskResponse;
import com.momentum.app.enums.TaskPriority;
import com.momentum.app.enums.TaskStatus;
import com.momentum.app.exception.GlobalExceptionHandler;
import com.momentum.app.security.CustomUserDetailsService;
import com.momentum.app.security.JwtAccessDeniedHandler;
import com.momentum.app.security.JwtAuthenticationEntryPoint;
import com.momentum.app.security.UserPrincipal;
import com.momentum.app.service.JwtService;
import com.momentum.app.service.TaskService;

@WebMvcTest(TaskController.class)
@Import({ SecurityConfig.class, CorsConfig.class, GlobalExceptionHandler.class,
        JwtAuthenticationEntryPoint.class, JwtAccessDeniedHandler.class })
class TaskPatchControllerTest {

    private static final String TOKEN = "a.valid.token";
    private static final Long USER_ID = 42L;

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private TaskService taskService;

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

    private MockHttpServletRequestBuilder patchTask(String body) {
        return patch("/api/tasks/30")
                .header("Authorization", "Bearer " + TOKEN)
                .contentType(MediaType.APPLICATION_JSON)
                .content(body);
    }

    private TaskResponse task() {
        return new TaskResponse(30L, "Write docs", null, TaskPriority.MEDIUM, TaskStatus.PENDING,
                null, LocalDate.now(), LocalDateTime.now(), LocalDateTime.now(), List.of(), 0, 0);
    }

    private TaskPatchRequest capturePatch() {
        ArgumentCaptor<TaskPatchRequest> captor = ArgumentCaptor.forClass(TaskPatchRequest.class);
        verify(taskService).patchTask(eq(USER_ID), eq(30L), captor.capture());
        return captor.getValue();
    }

    @Test
    void patchTask_appliesOnlyTheSuppliedField() throws Exception {
        when(taskService.patchTask(eq(USER_ID), eq(30L), any())).thenReturn(task());

        mockMvc.perform(patchTask("{\"status\":\"COMPLETED\"}"))
                .andExpect(status().isOk());

        TaskPatchRequest sent = capturePatch();
        assertThat(sent.status()).isEqualTo(TaskStatus.COMPLETED);
        assertThat(sent.title()).isNull();
        assertThat(sent.description()).isNull();
        assertThat(sent.dueDate()).isNull();
        assertThat(sent.categoryId()).isNull();
    }


    @Test
    void patchTask_acceptsEmptyBody() throws Exception {
        when(taskService.patchTask(eq(USER_ID), eq(30L), any())).thenReturn(task());

        mockMvc.perform(patchTask("{}")).andExpect(status().isOk());

        TaskPatchRequest sent = capturePatch();
        assertThat(sent.title()).isNull();
        assertThat(sent.status()).isNull();
    }

    @Test
    void patchTask_returns400ForBlankTitle() throws Exception {
        mockMvc.perform(patchTask("{\"title\":\"  \"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.title").exists());

        verify(taskService, never()).patchTask(any(), any(), any());
    }

    @Test
    void patchTask_acceptsPastDueDate() throws Exception {
        when(taskService.patchTask(eq(USER_ID), eq(30L), any())).thenReturn(task());

        mockMvc.perform(patchTask("{\"dueDate\":\"2020-01-01\"}"))
                .andExpect(status().isOk());

        assertThat(capturePatch().dueDate()).isEqualTo(LocalDate.of(2020, 1, 1));
    }

    @Test
    void patchTask_returns401WithoutToken() throws Exception {
        mockMvc.perform(patch("/api/tasks/30")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\":\"COMPLETED\"}"))
                .andExpect(status().isUnauthorized());

        verify(taskService, never()).patchTask(any(), any(), any());
    }
}
