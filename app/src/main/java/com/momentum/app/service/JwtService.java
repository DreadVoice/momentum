package com.momentum.app.service;

import com.momentum.app.entity.User;

public interface JwtService {
    String generateAccessToken(User user);
    String generateRefreshToken(User user);
    Long extractUserId(String token); 
    boolean isTokenValid(String token, User user);
    boolean isRefreshToken(String token); 
}
