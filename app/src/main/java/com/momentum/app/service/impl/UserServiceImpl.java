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

    private User findUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    @Override
    public UserResponse getUserById(Long userId) {
        return toResponse(findUser(userId));
    }

    @Override
    public UserResponse updateUser(Long userId, UserUpdateRequest request) {
        User user = findUser(userId);

        renameUsername(user, request.username());
        changeEmail(user, request.email());
        user.setProfilePhoto(normalizeProfilePhoto(request.profilePhoto()));
        return toResponse(userRepository.save(user));
    }

    @Override
    public UserResponse patchUser(Long userId, UserPatchRequest request) {
        User user = findUser(userId);

        if (request.username() != null) {
            renameUsername(user, request.username());
        }
        if (request.email() != null) {
            changeEmail(user, request.email());
        }
        if (request.profilePhoto() != null) {
            user.setProfilePhoto(normalizeProfilePhoto(request.profilePhoto()));
        }

        return toResponse(userRepository.save(user));
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
    public void changePassword(Long userId, ChangePasswordRequest request) {
        User user = findUser(userId);
        if (!passwordEncoder.matches(request.currentPassword(), user.getPassword())) {
            throw new InvalidCredentialsException("Current password is incorrect");
        }
        user.setPassword(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
    }

    @Override
    public void deleteUser(Long userId, DeleteAccountRequest request) {
        User user = findUser(userId);

        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
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

    private UserResponse toResponse(User user) {
        return new UserResponse(user.getId(), user.getUsername(), user.getEmail(), user.getProfilePhoto(), user.getCreatedAt());
    }

}