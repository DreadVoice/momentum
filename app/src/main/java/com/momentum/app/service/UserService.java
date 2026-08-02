package com.momentum.app.service;

import com.momentum.app.dto.user.ChangePasswordRequest;
import com.momentum.app.dto.user.DeleteAccountRequest;
import com.momentum.app.dto.user.UserPatchRequest;
import com.momentum.app.dto.user.UserResponse;
import com.momentum.app.dto.user.UserUpdateRequest;

public interface UserService {
    UserResponse getUserById(Long userId);
    UserResponse updateUser(Long userId, UserUpdateRequest userUpdateRequest);
    UserResponse patchUser(Long userId, UserPatchRequest userPatchRequest);
    void changePassword(Long userId, ChangePasswordRequest changePasswordRequest);
    void deleteUser(Long userId, DeleteAccountRequest deleteAccountRequest);
}
