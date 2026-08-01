package com.momentum.app.controller;

import java.time.LocalDateTime;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.momentum.app.dto.health.AuthCheckResponse;
import com.momentum.app.dto.health.HealthResponse;
import com.momentum.app.security.UserPrincipal;

@RestController
@RequestMapping("/api/health")
public class HealthController {

    @GetMapping
    public ResponseEntity<HealthResponse> health() {
        return ResponseEntity.ok(new HealthResponse("UP", LocalDateTime.now()));
    }

    @GetMapping("/me")
    public ResponseEntity<AuthCheckResponse> me(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(new AuthCheckResponse(
                principal.id(),
                principal.username(),
                LocalDateTime.now()));
    }
}
