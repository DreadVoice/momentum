package com.momentum.app.service.impl;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.momentum.app.dto.user.ChangePasswordRequest;
import com.momentum.app.dto.user.DeleteAccountRequest;
import com.momentum.app.dto.user.UserPatchRequest;
import com.momentum.app.dto.user.UserResponse;
import com.momentum.app.dto.user.UserUpdateRequest;
import com.momentum.app.entity.User;
import com.momentum.app.exception.InvalidCredentialsException;
import com.momentum.app.exception.ResourceAlreadyExistsException;
import com.momentum.app.exception.ResourceNotFoundException;
import com.momentum.app.repository.UserRepository;
import com.momentum.app.service.UserService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    private User findUserById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    @Override
    public UserResponse getUserById(Long userId) {
        return toUserResponse(findUserById(userId));
    }

    @Override
    public UserResponse updateUser(Long userId, UserUpdateRequest userUpdateRequest) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        renameUsername(user, userUpdateRequest.username());
        changeEmail(user, userUpdateRequest.email());
        user.setProfilePhoto(normalizeProfilePhoto(userUpdateRequest.profilePhoto()));
        user.setUpdatedAt(java.time.LocalDateTime.now());
        return toUserResponse(userRepository.save(user));
    }

    @Override
    public UserResponse patchUser(Long userId, UserPatchRequest userPatchRequest) {
        User user = findUserById(userId);

        if (userPatchRequest.username() != null) {
            renameUsername(user, userPatchRequest.username());
        }
        if (userPatchRequest.email() != null) {
            changeEmail(user, userPatchRequest.email());
        }
        if (userPatchRequest.profilePhoto() != null) {
            user.setProfilePhoto(normalizeProfilePhoto(userPatchRequest.profilePhoto()));
        }

        user.setUpdatedAt(java.time.LocalDateTime.now());
        return toUserResponse(userRepository.save(user));
    }

    private void renameUsername(User user, String username) {
        String normalizedUsername = username.trim();

        if (userRepository.existsByUsername(normalizedUsername)
                && !user.getUsername().equals(normalizedUsername)) {
            throw new ResourceAlreadyExistsException("Username is already in use");
        }

        user.setUsername(normalizedUsername);
    }

    private void changeEmail(User user, String email) {
        String normalizedEmail = email.trim().toLowerCase();

        if (userRepository.existsByEmail(normalizedEmail) && !user.getEmail().equals(normalizedEmail)) {
            throw new ResourceAlreadyExistsException("Email is already in use");
        }

        user.setEmail(normalizedEmail);
    }

    @Override
    public void changePassword(Long userId, ChangePasswordRequest changePasswordRequest) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (!passwordEncoder.matches(changePasswordRequest.currentPassword(), user.getPassword())) {
            throw new InvalidCredentialsException("Current password is incorrect");
        }
        user.setPassword(passwordEncoder.encode(changePasswordRequest.newPassword()));
        user.setUpdatedAt(java.time.LocalDateTime.now());
        userRepository.save(user);
    }

    @Override
    public void deleteUser(Long userId, DeleteAccountRequest deleteAccountRequest) {
        User user = findUserById(userId);

        if (!passwordEncoder.matches(deleteAccountRequest.password(), user.getPassword())) {
            throw new InvalidCredentialsException("Password is incorrect");
        }

        userRepository.delete(user);
    }

    private String normalizeProfilePhoto(String profilePhoto) {
        if (profilePhoto == null) {
            return null;
        }
        String trimmed = profilePhoto.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private UserResponse toUserResponse(User user) {
        return new UserResponse(user.getId(), user.getUsername(), user.getEmail(), user.getProfilePhoto(), user.getCreatedAt());
    }

}