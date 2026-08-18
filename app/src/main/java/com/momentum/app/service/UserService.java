package com.momentum.app.service;

import com.momentum.app.dto.user.ChangePasswordRequest;
import com.momentum.app.dto.user.DeleteAccountRequest;
import com.momentum.app.dto.user.UserPatchRequest;
import com.momentum.app.dto.user.UserResponse;
import com.momentum.app.dto.user.UserUpdateRequest;

public interface UserService {
    UserResponse getUserById(Long userId);
    UserResponse updateUser(Long userId, UserUpdateRequest request);
    UserResponse patchUser(Long userId, UserPatchRequest request);
    void changePassword(Long userId, ChangePasswordRequest request);
    void deleteUser(Long userId, DeleteAccountRequest request);
}
