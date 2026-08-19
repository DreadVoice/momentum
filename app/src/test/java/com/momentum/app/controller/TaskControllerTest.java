package com.momentum.app.controller;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import org.mockito.ArgumentCaptor;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.isNull;
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
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import com.momentum.app.config.CorsConfig;
import com.momentum.app.config.SecurityConfig;
import com.momentum.app.dto.common.PageResponse;
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
import com.momentum.app.security.RateLimitFilter;
import com.momentum.app.security.UserPrincipal;
import com.momentum.app.service.JwtService;
import com.momentum.app.service.TaskService;

import tools.jackson.databind.ObjectMapper;

@WebMvcTest(TaskController.class)
@Import({ SecurityConfig.class, CorsConfig.class, GlobalExceptionHandler.class,
        JwtAuthenticationEntryPoint.class, JwtAccessDeniedHandler.class, RateLimitFilter.class })
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
    void createTask_acceptsPastDueDate() throws Exception {
        when(taskService.createTask(eq(USER_ID), any(TaskCreateRequest.class))).thenReturn(task(30L));

        mockMvc.perform(authed(post("/api/tasks"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(new TaskCreateRequest("Write docs", null, null, null,
                        LocalDate.now().minusDays(1)))))
                .andExpect(status().isCreated());

        verify(taskService).createTask(eq(USER_ID), any(TaskCreateRequest.class));
    }

    @Test
    void updateTask_acceptsPastDueDateSoOverdueTasksStayEditable() throws Exception {
        when(taskService.updateTask(eq(USER_ID), eq(30L), any(TaskUpdateRequest.class))).thenReturn(task(30L));

        mockMvc.perform(authed(put("/api/tasks/30"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(new TaskUpdateRequest("Write docs", null, TaskPriority.HIGH,
                        TaskStatus.COMPLETED, null, LocalDate.now().minusDays(3)))))
                .andExpect(status().isOk());

        verify(taskService).updateTask(eq(USER_ID), eq(30L), any(TaskUpdateRequest.class));
    }

    private PageResponse<TaskResponse> page(TaskResponse... tasks) {
        List<TaskResponse> content = List.of(tasks);
        return new PageResponse<>(content, 0, 20, content.size(), 1);
    }

    @Test
    void getTasks_withNoFiltersReturnsAll() throws Exception {
        when(taskService.getTasks(eq(USER_ID), isNull(), isNull(), isNull(), any()))
                .thenReturn(page(task(30L), task(31L)));

        mockMvc.perform(authed(get("/api/tasks")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(2))
                .andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.page").value(0));
    }

    @Test
    void getTasks_passesEachFilterThrough() throws Exception {
        when(taskService.getTasks(eq(USER_ID), eq(TaskStatus.COMPLETED), isNull(), isNull(), any()))
                .thenReturn(page(task(30L)));

        mockMvc.perform(authed(get("/api/tasks").param("status", "COMPLETED")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1));

        verify(taskService).getTasks(eq(USER_ID), eq(TaskStatus.COMPLETED), isNull(), isNull(), any());
    }

    @Test
    void getTasks_appliesFiltersTogether() throws Exception {
        when(taskService.getTasks(eq(USER_ID), eq(TaskStatus.PENDING), eq(TaskPriority.HIGH), eq(7L), any()))
                .thenReturn(page(task(30L)));

        mockMvc.perform(authed(get("/api/tasks")
                .param("status", "PENDING").param("priority", "HIGH").param("categoryId", "7")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1));

        verify(taskService).getTasks(eq(USER_ID), eq(TaskStatus.PENDING), eq(TaskPriority.HIGH), eq(7L), any());
    }

    @Test
    void getTasks_passesPageRequestToTheService() throws Exception {
        when(taskService.getTasks(eq(USER_ID), isNull(), isNull(), isNull(), any()))
                .thenReturn(page(task(30L)));

        mockMvc.perform(authed(get("/api/tasks").param("page", "2").param("size", "5")))
                .andExpect(status().isOk());

        ArgumentCaptor<Pageable> captor = ArgumentCaptor.forClass(Pageable.class);
        verify(taskService).getTasks(eq(USER_ID), isNull(), isNull(), isNull(), captor.capture());
        assertThat(captor.getValue().getPageNumber()).isEqualTo(2);
        assertThat(captor.getValue().getPageSize()).isEqualTo(5);
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
    @Test
    void getTasks_acceptsEverySortableProperty() throws Exception {
        when(taskService.getTasks(eq(USER_ID), isNull(), isNull(), isNull(), any()))
                .thenReturn(page(task(30L)));

        for (String property : List.of("createdAt", "dueDate", "priority", "status", "title")) {
            mockMvc.perform(authed(get("/api/tasks").param("sort", property)))
                    .andExpect(status().isOk());
        }
    }

    @Test
    void getTasks_returns400ForUnsortableProperty() throws Exception {
        mockMvc.perform(authed(get("/api/tasks").param("sort", "password")))
                .andExpect(status().isBadRequest());

        verify(taskService, never()).getTasks(any(), any(), any(), any(), any());
    }

}
