package com.ecommerce.monolith.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CheckoutRequest {

    @NotNull(message = "Simulate payment status is required")
    private PaymentSimulation simulation;

    public enum PaymentSimulation {
        SUCCESS, FAILED
    }
}