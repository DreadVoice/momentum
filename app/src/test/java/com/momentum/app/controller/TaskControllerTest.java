package com.momentum.app.controller;

import java.time.LocalDate;
import java.time.LocalDateTime;
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
import com.momentum.app.dto.task.TaskCreateRequest;
import com.momentum.app.dto.task.TaskResponse;
import com.momentum.app.dto.task.TaskUpdateRequest;
import com.momentum.app.enums.TaskPriority;
import com.momentum.app.enums.TaskStatus;
import com.momentum.app.exception.GlobalExceptionHandler;
import com.momentum.app.exception.ResourceNotFoundException;
import com.momentum.app.security.CustomUserDetailsService;
import com.momentum.app.security.JwtAccessDeniedHandler;
import com.momentum.app.security.JwtAuthenticationEntryPoint;
import com.momentum.app.security.UserPrincipal;
import com.momentum.app.service.JwtService;
import com.momentum.app.service.TaskService;

import tools.jackson.databind.ObjectMapper;

@WebMvcTest(TaskController.class)
@Import({ SecurityConfig.class, CorsConfig.class, GlobalExceptionHandler.class,
        JwtAuthenticationEntryPoint.class, JwtAccessDeniedHandler.class })
class TaskControllerTest {

    private static final String TOKEN = "a.valid.token";
    private static final Long USER_ID = 42L;

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

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

    private MockHttpServletRequestBuilder authed(MockHttpServletRequestBuilder builder) {
        return builder.header("Authorization", "Bearer " + TOKEN);
    }

    private String json(Object body) {
        return objectMapper.writeValueAsString(body);
    }

    private TaskResponse task(Long id) {
        return new TaskResponse(id, "Write docs", null, TaskPriority.MEDIUM, TaskStatus.PENDING,
                null, LocalDate.now().plusDays(1), LocalDateTime.now(), LocalDateTime.now(),
                List.of(), 0, 0);
    }

    @Test
    void createTask_returns201WithLocation() throws Exception {
        when(taskService.createTask(eq(USER_ID), any(TaskCreateRequest.class))).thenReturn(task(30L));

        mockMvc.perform(authed(post("/api/tasks"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(new TaskCreateRequest("Write docs", null, TaskPriority.MEDIUM, null,
                        LocalDate.now().plusDays(1)))))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", "/api/tasks/30"))
                .andExpect(jsonPath("$.id").value(30))
                .andExpect(jsonPath("$.status").value("PENDING"));
    }

    @Test
    void createTask_returns400ForBlankTitle() throws Exception {
        mockMvc.perform(authed(post("/api/tasks"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(new TaskCreateRequest(" ", null, null, null, null))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.title").exists());

        verify(taskService, never()).createTask(any(), any());
    }

    @Test
    void createTask_returns400ForPastDueDate() throws Exception {
        mockMvc.perform(authed(post("/api/tasks"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(new TaskCreateRequest("Write docs", null, null, null,
                        LocalDate.now().minusDays(1)))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.dueDate").exists());

        verify(taskService, never()).createTask(any(), any());
    }

    @Test
    void getTasks_withNoFiltersReturnsAll() throws Exception {
        when(taskService.getAllTasks(USER_ID)).thenReturn(List.of(task(30L), task(31L)));

        mockMvc.perform(authed(get("/api/tasks")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));

        verify(taskService).getAllTasks(USER_ID);
    }

    @Test
    void getTasks_filtersByStatus() throws Exception {
        when(taskService.getTasksByStatus(USER_ID, TaskStatus.COMPLETED)).thenReturn(List.of(task(30L)));

        mockMvc.perform(authed(get("/api/tasks").param("status", "COMPLETED")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));

        verify(taskService).getTasksByStatus(USER_ID, TaskStatus.COMPLETED);
        verify(taskService, never()).getAllTasks(any());
    }

    @Test
    void getTasks_filtersByPriority() throws Exception {
        when(taskService.getTasksByPriority(USER_ID, TaskPriority.HIGH)).thenReturn(List.of(task(30L)));

        mockMvc.perform(authed(get("/api/tasks").param("priority", "HIGH")))
                .andExpect(status().isOk());

        verify(taskService).getTasksByPriority(USER_ID, TaskPriority.HIGH);
    }

    @Test
    void getTasks_filtersByCategory() throws Exception {
        when(taskService.getTasksByCategory(USER_ID, 7L)).thenReturn(List.of(task(30L)));

        mockMvc.perform(authed(get("/api/tasks").param("categoryId", "7")))
                .andExpect(status().isOk());

        verify(taskService).getTasksByCategory(USER_ID, 7L);
    }

    @Test
    void getTasks_returns400ForUnknownStatusValue() throws Exception {
        mockMvc.perform(authed(get("/api/tasks").param("status", "BOGUS")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(
                        "Invalid value for 'status'. Allowed values: [PENDING, IN_PROGRESS, COMPLETED]."));

        verifyNoInteractions(taskService);
    }

    @Test
    void getTasks_returns400WhenFiltersAreCombined() throws Exception {
        mockMvc.perform(authed(get("/api/tasks")
                .param("status", "PENDING")
                .param("priority", "HIGH")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(
                        "Only one of status, priority or categoryId may be supplied"));

        verifyNoInteractions(taskService);
    }

    @Test
    void getOverdueTasks_returnsList() throws Exception {
        when(taskService.getOverdueTasks(USER_ID)).thenReturn(List.of(task(30L)));

        mockMvc.perform(authed(get("/api/tasks/overdue")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    void getTaskStats_aggregatesEveryStatus() throws Exception {
        when(taskService.countTasksByStatus(USER_ID, TaskStatus.PENDING)).thenReturn(3L);
        when(taskService.countTasksByStatus(USER_ID, TaskStatus.IN_PROGRESS)).thenReturn(2L);
        when(taskService.countTasksByStatus(USER_ID, TaskStatus.COMPLETED)).thenReturn(5L);

        mockMvc.perform(authed(get("/api/tasks/stats")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.countsByStatus.PENDING").value(3))
                .andExpect(jsonPath("$.countsByStatus.IN_PROGRESS").value(2))
                .andExpect(jsonPath("$.countsByStatus.COMPLETED").value(5))
                .andExpect(jsonPath("$.total").value(10));
    }

    @Test
    void getTaskById_returnsTask() throws Exception {
        when(taskService.getTaskById(USER_ID, 30L)).thenReturn(task(30L));

        mockMvc.perform(authed(get("/api/tasks/30")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(30));
    }

    @Test
    void getTaskById_returns404ForTaskOwnedBySomeoneElse() throws Exception {
        when(taskService.getTaskById(USER_ID, 99L)).thenThrow(new ResourceNotFoundException("Task not found"));

        mockMvc.perform(authed(get("/api/tasks/99")))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Task not found"));
    }

    @Test
    void updateTask_returns200() throws Exception {
        when(taskService.updateTask(eq(USER_ID), eq(30L), any(TaskUpdateRequest.class))).thenReturn(task(30L));

        mockMvc.perform(authed(put("/api/tasks/30"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(new TaskUpdateRequest("Write docs", null, TaskPriority.HIGH,
                        TaskStatus.IN_PROGRESS, null, null))))
                .andExpect(status().isOk());

        verify(taskService).updateTask(eq(USER_ID), eq(30L), any(TaskUpdateRequest.class));
    }

    @Test
    void deleteTask_returns204() throws Exception {
        mockMvc.perform(authed(delete("/api/tasks/30")))
                .andExpect(status().isNoContent());

        verify(taskService).deleteTask(USER_ID, 30L);
    }

    @Test
    void deleteTask_returns404ForTaskOwnedBySomeoneElse() throws Exception {
        doThrow(new ResourceNotFoundException("Task not found"))
                .when(taskService).deleteTask(USER_ID, 99L);

        mockMvc.perform(authed(delete("/api/tasks/99")))
                .andExpect(status().isNotFound());
    }

    @Test
    void endpointsRequireAuthentication() throws Exception {
        mockMvc.perform(get("/api/tasks")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/tasks/overdue")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/tasks/stats")).andExpect(status().isUnauthorized());
        mockMvc.perform(delete("/api/tasks/30")).andExpect(status().isUnauthorized());

        verifyNoInteractions(taskService);
    }
}
