package com.momentum.app.service.impl;

import com.momentum.app.entity.User;
import com.momentum.app.service.JwtService;

public class JwtServiceImpl implements JwtService {

    @Override
    public String generateAccessToken(User user) {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'generateAccessToken'");
    }

    @Override
    public String generateRefreshToken(User user) {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'generateRefreshToken'");
    }

    @Override
    public Long extractUserId(String token) {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'extractUserId'");
    }

    @Override
    public boolean isTokenValid(String token, User user) {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'isTokenValid'");
    }

    @Override
    public boolean isRefreshToken(String token) {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'isRefreshToken'");
    }

}
