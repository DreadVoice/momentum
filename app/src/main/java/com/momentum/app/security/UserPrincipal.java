package com.momentum.app.security;

import java.util.Collection;
import java.util.List;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import com.momentum.app.entity.User;

/**
 * Authenticated caller as held in the {@code SecurityContext}. Carries the user id so
 * controllers can hand it straight to the service layer, which is keyed on {@code Long userId}.
 */
public record UserPrincipal(Long id, String username, String password) implements UserDetails {

    public static UserPrincipal from(User user) {
        return new UserPrincipal(user.getId(), user.getUsername(), user.getPassword());
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of();
    }

    @Override
    public String getUsername() {
        return username;
    }

    @Override
    public String getPassword() {
        return password;
    }
}
