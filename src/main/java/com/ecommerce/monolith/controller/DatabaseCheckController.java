package com.ecommerce.monolith.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/db")
public class DatabaseCheckController {

    private final DataSource dataSource;

    public DatabaseCheckController(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @GetMapping("/test")
    public ResponseEntity<Map<String, Object>> testConnection() {
        Map<String, Object> response = new HashMap<>();

        try (Connection connection = dataSource.getConnection()) {
            DatabaseMetaData metaData = connection.getMetaData();
            
            response.put("status", "SUCCESS");
            response.put("connected", true);
            response.put("databaseProductName", metaData.getDatabaseProductName());
            response.put("databaseProductVersion", metaData.getDatabaseProductVersion());
            response.put("driverName", metaData.getDriverName());
            response.put("userName", metaData.getUserName());
            response.put("catalog", connection.getCatalog());

            return ResponseEntity.ok(response);
        } catch (Exception ex) {
            response.put("status", "FAILED");
            response.put("connected", false);
            response.put("errorType", ex.getClass().getName());
            response.put("errorMessage", ex.getMessage());

            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(response);
        }
    }
}