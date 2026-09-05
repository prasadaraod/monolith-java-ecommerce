package com.ecommerce.monolith.controller;

// import com.ecommerce.monolith.model.Product;
// import com.ecommerce.monolith.repository.ProductRepository;
// import org.springframework.http.HttpStatus;
// import org.springframework.http.ResponseEntity;
// import org.springframework.web.bind.annotation.*;

import com.ecommerce.monolith.dto.request.AuthRequest.LoginRequest;
import com.ecommerce.monolith.dto.request.AuthRequest.RegisterRequest;
import com.ecommerce.monolith.dto.response.AuthResponse;
import com.ecommerce.monolith.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(
            @Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(201).body(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }
}