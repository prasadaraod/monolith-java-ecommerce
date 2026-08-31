package com.ecommerce.monolith.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.Map;

@RestController
public class HomeController {

    // Handles the root domain: https://monolith-java-ecommerce.prasadaraodarla.co.in/
    @GetMapping("/")
    public Map<String, Object> index() {
        return Map.of(
            "service", "Monolith Java E-Commerce",
            "environment", "production",
            "message", "Welcome to the E-Commerce API",
            "status", "RUNNING"
        );
    }

    // Handles: https://monolith-java-ecommerce.prasadaraodarla.co.in/api/status
    @GetMapping("/api/status")
    public Map<String, Object> status() {
        return Map.of(
            "service", "Monolith Java E-Commerce",
            "status", "UP",
            "version", "1.0.0"
        );
    }
}