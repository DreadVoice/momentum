package com.momentum.app.controller;

import java.time.LocalDateTime;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
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
import com.momentum.app.dto.user.ChangePasswordRequest;
import com.momentum.app.dto.user.DeleteAccountRequest;
import com.momentum.app.dto.user.UserResponse;
import com.momentum.app.dto.user.UserUpdateRequest;
import com.momentum.app.exception.GlobalExceptionHandler;
import com.momentum.app.exception.InvalidCredentialsException;
import com.momentum.app.exception.ResourceAlreadyExistsException;
import com.momentum.app.security.CustomUserDetailsService;
import com.momentum.app.security.JwtAccessDeniedHandler;
import com.momentum.app.security.JwtAuthenticationEntryPoint;
import com.momentum.app.security.UserPrincipal;
import com.momentum.app.service.JwtService;
import com.momentum.app.service.UserService;

import tools.jackson.databind.ObjectMapper;

@WebMvcTest(UserController.class)
@Import({ SecurityConfig.class, CorsConfig.class, GlobalExceptionHandler.class,
        JwtAuthenticationEntryPoint.class, JwtAccessDeniedHandler.class })
class UserControllerTest {

    private static final String TOKEN = "a.valid.token";
    private static final Long USER_ID = 42L;

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private UserService userService;

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

    private UserResponse userResponse() {
        return new UserResponse(USER_ID, "alice", "alice@example.com", null, LocalDateTime.now());
    }

    @Test
    void getCurrentUser_returnsProfileForTokenSubject() throws Exception {
        when(userService.getUserById(USER_ID)).thenReturn(userResponse());

        mockMvc.perform(authed(get("/api/users/me")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(42))
                .andExpect(jsonPath("$.username").value("alice"))
                .andExpect(jsonPath("$.email").value("alice@example.com"));
    }

    @Test
    void getCurrentUser_requiresAuthentication() throws Exception {
        mockMvc.perform(get("/api/users/me"))
                .andExpect(status().isUnauthorized());

        verify(userService, never()).getUserById(any());
    }

    @Test
    void updateCurrentUser_usesTokenSubjectNotRequestBody() throws Exception {
        when(userService.updateUser(eq(USER_ID), any(UserUpdateRequest.class))).thenReturn(userResponse());

        mockMvc.perform(authed(put("/api/users/me"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(new UserUpdateRequest("alice", "alice@example.com", null))))
                .andExpect(status().isOk());

        verify(userService).updateUser(eq(USER_ID), any(UserUpdateRequest.class));
    }

    @Test
    void updateCurrentUser_returns400ForInvalidBody() throws Exception {
        mockMvc.perform(authed(put("/api/users/me"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(new UserUpdateRequest("a!", "not-an-email", null))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.username").exists())
                .andExpect(jsonPath("$.fieldErrors.email").exists());

        verify(userService, never()).updateUser(any(), any());
    }

    @Test
    void updateCurrentUser_acceptsAndReturnsProfilePhoto() throws Exception {
        String photo = "https://cdn.example.com/alice.png";
        when(userService.updateUser(eq(USER_ID), any(UserUpdateRequest.class)))
                .thenReturn(new UserResponse(USER_ID, "alice", "alice@example.com", photo, LocalDateTime.now()));

        mockMvc.perform(authed(put("/api/users/me"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(new UserUpdateRequest("alice", "alice@example.com", photo))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.profilePhoto").value(photo));
    }

    @Test
    void updateCurrentUser_returns400ForMalformedProfilePhotoUrl() throws Exception {
        mockMvc.perform(authed(put("/api/users/me"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(new UserUpdateRequest("alice", "alice@example.com", "not a url"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.profilePhoto").exists());

        verify(userService, never()).updateUser(any(), any());
    }

    @Test
    void updateCurrentUser_returns409ForTakenUsername() throws Exception {
        when(userService.updateUser(eq(USER_ID), any(UserUpdateRequest.class)))
                .thenThrow(new ResourceAlreadyExistsException("Username is already in use"));

        mockMvc.perform(authed(put("/api/users/me"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(new UserUpdateRequest("bob", "bob@example.com", null))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Username is already in use"));
    }

    @Test
    void changePassword_returns204() throws Exception {
        doNothing().when(userService).changePassword(eq(USER_ID), any(ChangePasswordRequest.class));

        mockMvc.perform(authed(patch("/api/users/me/password"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(new ChangePasswordRequest("oldpassword", "newpassword123"))))
                .andExpect(status().isNoContent());

        verify(userService).changePassword(eq(USER_ID), any(ChangePasswordRequest.class));
    }

    @Test
    void changePassword_returns401ForWrongCurrentPassword() throws Exception {
        doThrow(new InvalidCredentialsException("Current password is incorrect"))
                .when(userService).changePassword(eq(USER_ID), any(ChangePasswordRequest.class));

        mockMvc.perform(authed(patch("/api/users/me/password"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(new ChangePasswordRequest("wrongpassword", "newpassword123"))))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Current password is incorrect"));
    }

    @Test
    void changePassword_returns400ForShortNewPassword() throws Exception {
        mockMvc.perform(authed(patch("/api/users/me/password"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(new ChangePasswordRequest("oldpassword", "short"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.newPassword").exists());

        verify(userService, never()).changePassword(any(), any());
    }

    @Test
    void deleteCurrentUser_returns204WhenPasswordConfirmed() throws Exception {
        mockMvc.perform(authed(delete("/api/users/me"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(new DeleteAccountRequest("password123"))))
                .andExpect(status().isNoContent());

        verify(userService).deleteUser(eq(USER_ID), any(DeleteAccountRequest.class));
    }

    @Test
    void deleteCurrentUser_returns401ForWrongPassword() throws Exception {
        doThrow(new InvalidCredentialsException("Password is incorrect"))
                .when(userService).deleteUser(eq(USER_ID), any(DeleteAccountRequest.class));

        mockMvc.perform(authed(delete("/api/users/me"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(new DeleteAccountRequest("wrongpassword"))))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Password is incorrect"));
    }

    @Test
    void deleteCurrentUser_returns400WhenPasswordMissing() throws Exception {
        mockMvc.perform(authed(delete("/api/users/me"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(new DeleteAccountRequest(" "))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.password").exists());

        verify(userService, never()).deleteUser(any(), any());
    }

    @Test
    void deleteCurrentUser_requiresAuthentication() throws Exception {
        mockMvc.perform(delete("/api/users/me")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(new DeleteAccountRequest("password123"))))
                .andExpect(status().isUnauthorized());

        verify(userService, never()).deleteUser(any(), any());
    }
}
