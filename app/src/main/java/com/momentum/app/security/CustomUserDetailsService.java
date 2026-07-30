package com.momentum.app.security;

import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.momentum.app.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    /**
     * Primary lookup for the JWT filter: our token subject is the numeric user id,
     * not the username.
     */
    @Transactional(readOnly = true)
    public UserPrincipal loadUserById(Long userId) {
        return userRepository.findById(userId)
                .map(UserPrincipal::from)
                .orElseThrow(() -> new UsernameNotFoundException("No user with id " + userId));
    }

    @Override
    @Transactional(readOnly = true)
    public UserPrincipal loadUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .map(UserPrincipal::from)
                .orElseThrow(() -> new UsernameNotFoundException("No user with username " + username));
    }
}
