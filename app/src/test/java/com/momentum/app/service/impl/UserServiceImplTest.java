package com.momentum.app.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.momentum.app.dto.user.ChangePasswordRequest;
import com.momentum.app.dto.user.UserResponse;
import com.momentum.app.dto.user.UserUpdateRequest;
import com.momentum.app.entity.User;
import com.momentum.app.exception.InvalidCredentialsException;
import com.momentum.app.exception.ResourceAlreadyExistsException;
import com.momentum.app.exception.ResourceNotFoundException;
import com.momentum.app.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
class UserServiceImplTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserServiceImpl userService;

    private User user() {
        return User.builder()
                .id(1L)
                .username("alice")
                .email("alice@example.com")
                .password("hashed")
                .build();
    }

    @Test
    void getUserById_returnsResponse() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user()));

        UserResponse response = userService.getUserById(1L);

        assertThat(response.id()).isEqualTo(1L);
        assertThat(response.username()).isEqualTo("alice");
        assertThat(response.email()).isEqualTo("alice@example.com");
    }

    @Test
    void getUserById_whenMissing_throwsResourceNotFound() {
        when(userRepository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.getUserById(1L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void updateUser_updatesUsernameAndEmail() {
        User existing = user();
        when(userRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(userRepository.existsByEmail("bob@example.com")).thenReturn(false);
        when(userRepository.existsByUsername("bob")).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        UserResponse response = userService.updateUser(1L, new UserUpdateRequest("bob", "Bob@Example.com"));

        assertThat(response.username()).isEqualTo("bob");
        assertThat(response.email()).isEqualTo("bob@example.com");
    }

    @Test
    void updateUser_toExistingEmail_throwsResourceAlreadyExists() {
        User existing = user();
        when(userRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(userRepository.existsByEmail("taken@example.com")).thenReturn(true);

        assertThatThrownBy(() -> userService.updateUser(1L, new UserUpdateRequest("alice", "taken@example.com")))
                .isInstanceOf(ResourceAlreadyExistsException.class);
        verify(userRepository, never()).save(any());
    }

    @Test
    void changePassword_withCorrectCurrentPassword_savesNewHash() {
        User existing = user();
        when(userRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(passwordEncoder.matches("current", "hashed")).thenReturn(true);
        when(passwordEncoder.encode("newPassword")).thenReturn("new-hash");

        userService.changePassword(1L, new ChangePasswordRequest("current", "newPassword"));

        assertThat(existing.getPassword()).isEqualTo("new-hash");
        verify(userRepository).save(existing);
    }

    @Test
    void changePassword_withWrongCurrentPassword_throwsInvalidCredentials() {
        User existing = user();
        when(userRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(passwordEncoder.matches("wrong", "hashed")).thenReturn(false);

        assertThatThrownBy(() -> userService.changePassword(1L, new ChangePasswordRequest("wrong", "newPassword")))
                .isInstanceOf(InvalidCredentialsException.class);
        verify(userRepository, never()).save(any());
    }

    @Test
    void deleteUser_deletesExistingUser() {
        User existing = user();
        when(userRepository.findById(1L)).thenReturn(Optional.of(existing));

        userService.deleteUser(1L);

        verify(userRepository).delete(existing);
    }
}
