package com.ecommerce.monolith.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
@AllArgsConstructor
public class CartResponse {
    private Long cartId;
    private List<ItemDto> items;
    private BigDecimal totalAmount;

    @Data
    @AllArgsConstructor
    public static class ItemDto {
        private Long itemId;
        private Long productId;
        private String productName;
        private BigDecimal unitPrice;
        private Integer quantity;
        private BigDecimal subtotal;
    }
}