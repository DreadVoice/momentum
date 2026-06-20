package com.momentum.app.service;

import com.momentum.app.dto.user.ChangePasswordRequest;
import com.momentum.app.dto.user.UserResponse;
import com.momentum.app.dto.user.UserUpdateRequest;

public interface UserService {
    UserResponse getUserById(Long userId);
    UserResponse updateUser(Long userId, UserUpdateRequest userUpdateRequest);
    void changePassword(Long userId, ChangePasswordRequest changePasswordRequest);
    void deleteUser(Long userId);
}
