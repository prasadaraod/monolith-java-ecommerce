package com.ecommerce.monolith.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class HomeController {

    @GetMapping("/status")
    public Map<String, Object> status() {
        return Map.of(
            "status", "UP",
            "service", "Monolith Java E-Commerce",
            "version", "1.0.0"
        );
    }
}