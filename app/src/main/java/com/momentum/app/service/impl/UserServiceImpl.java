package com.momentum.app.service.impl;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.momentum.app.dto.user.ChangePasswordRequest;
import com.momentum.app.dto.user.UserResponse;
import com.momentum.app.dto.user.UserUpdateRequest;
import com.momentum.app.entity.User;
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
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    @Override
    public UserResponse getUserById(Long userId) {
        return toUserResponse(findUserById(userId));
    }

    @Override
    public UserResponse updateUser(Long userId, UserUpdateRequest userUpdateRequest) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String normalizedEmail = userUpdateRequest.email().trim().toLowerCase();
        String normalizedUsername = userUpdateRequest.username().trim();

        if (userRepository.existsByEmail(normalizedEmail) && !user.getEmail().equals(normalizedEmail)) {
            throw new RuntimeException("Email is already in use");
        }

        if (userRepository.existsByUsername(normalizedUsername) && !user.getUsername().equals(normalizedUsername)) {
            throw new RuntimeException("Username is already in use");
        }

        user.setUsername(normalizedUsername);
        user.setEmail(normalizedEmail);
        user.setUpdatedAt(java.time.LocalDateTime.now());
        return toUserResponse(userRepository.save(user));
    }

    @Override
    public void changePassword(Long userId, ChangePasswordRequest changePasswordRequest) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (!passwordEncoder.matches(changePasswordRequest.currentPassword(), user.getPassword())) {
            throw new RuntimeException("Current password is incorrect");
        }
        user.setPassword(passwordEncoder.encode(changePasswordRequest.newPassword()));
        user.setUpdatedAt(java.time.LocalDateTime.now());
        userRepository.save(user);
    }

    @Override
    public void deleteUser(Long userId) {
        userRepository.delete(findUserById(userId));
    }

    private UserResponse toUserResponse(User user) {
        return new UserResponse(user.getId(), user.getUsername(), user.getEmail(), user.getProfilePhoto(), user.getCreatedAt());
    }

}