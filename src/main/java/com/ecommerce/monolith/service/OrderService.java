package com.ecommerce.monolith.service;

import com.ecommerce.monolith.dto.response.OrderResponse;
import com.ecommerce.monolith.model.*;
import com.ecommerce.monolith.repository.CartRepository;
import com.ecommerce.monolith.repository.OrderRepository;
import com.ecommerce.monolith.repository.ProductRepository;
import com.ecommerce.monolith.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final CartRepository cartRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    @Transactional
    public OrderResponse checkout(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Cart cart = cartRepository.findByUserEmail(userEmail)
                .orElseThrow(() -> new IllegalStateException("Cart is empty"));

        if (cart.getItems().isEmpty()) {
            throw new IllegalStateException("Cannot checkout an empty cart");
        }

        Order order = new Order();
        order.setUser(user);
        order.setStatus(Order.OrderStatus.PENDING);

        BigDecimal total = BigDecimal.ZERO;

        for (CartItem cartItem : cart.getItems()) {
            Product product = cartItem.getProduct();

            if (product.getStockQuantity() < cartItem.getQuantity()) {
                throw new IllegalStateException("Insufficient stock for product: " + product.getName());
            }

            // Decrement inventory
            product.setStockQuantity(product.getStockQuantity() - cartItem.getQuantity());
            productRepository.save(product);

            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(order);
            orderItem.setProduct(product);
            orderItem.setQuantity(cartItem.getQuantity());
            orderItem.setUnitPrice(product.getPrice());
            order.getItems().add(orderItem);

            total = total.add(product.getPrice().multiply(BigDecimal.valueOf(cartItem.getQuantity())));
        }

        order.setTotalAmount(total);
        Order savedOrder = orderRepository.save(order);

        // Clear cart after checkout
        cart.getItems().clear();
        cartRepository.save(cart);

        return mapToResponse(savedOrder);
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getUserOrders(String userEmail) {
        return orderRepository.findByUserEmailOrderByCreatedAtDesc(userEmail)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    private OrderResponse mapToResponse(Order order) {
        List<OrderResponse.OrderItemDto> items = order.getItems().stream()
                .map(item -> new OrderResponse.OrderItemDto(
                        item.getProduct().getId(),
                        item.getProduct().getName(),
                        item.getQuantity(),
                        item.getUnitPrice(),
                        item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity()))
                ))
                .toList();

        return new OrderResponse(
                order.getId(),
                order.getStatus().name(),
                order.getTotalAmount(),
                order.getCreatedAt(),
                items
        );
    }
}