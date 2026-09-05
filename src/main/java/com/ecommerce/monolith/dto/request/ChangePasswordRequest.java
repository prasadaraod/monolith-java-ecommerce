package com.ecommerce.monolith.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ChangePasswordRequest {

    @NotBlank(message = "Current password is required")
    private String currentPassword;

    @Size(min = 6, message = "New password must be at least 6 characters")
    @NotBlank(message = "New password is required")
    private String newPassword;
}