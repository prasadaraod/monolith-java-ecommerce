package com.ecommerce.monolith.service;

import com.ecommerce.monolith.dto.request.CartItemRequest;
import com.ecommerce.monolith.dto.response.CartResponse;
import com.ecommerce.monolith.model.Cart;
import com.ecommerce.monolith.model.CartItem;
import com.ecommerce.monolith.model.Product;
import com.ecommerce.monolith.model.User;
import com.ecommerce.monolith.repository.CartRepository;
import com.ecommerce.monolith.repository.ProductRepository;
import com.ecommerce.monolith.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CartService {

    private final CartRepository cartRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    @Transactional
    public CartResponse getCart(String userEmail) {
        Cart cart = getOrCreateCart(userEmail);
        return mapToResponse(cart);
    }

    @Transactional
    public CartResponse addItemToCart(String userEmail, CartItemRequest request) {
        Cart cart = getOrCreateCart(userEmail);

        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new IllegalArgumentException("Product not found"));

        if (product.getStockQuantity() < request.getQuantity()) {
            throw new IllegalArgumentException("Insufficient product stock");
        }

        CartItem item = cart.getItems().stream()
                .filter(i -> i.getProduct().getId().equals(product.getId()))
                .findFirst()
                .orElse(null);

        if (item != null) {
            item.setQuantity(item.getQuantity() + request.getQuantity());
        } else {
            CartItem newItem = new CartItem();
            newItem.setCart(cart);
            newItem.setProduct(product);
            newItem.setQuantity(request.getQuantity());
            cart.getItems().add(newItem);
        }

        return mapToResponse(cartRepository.save(cart));
    }

    @Transactional
    public CartResponse removeItemFromCart(String userEmail, Long itemId) {
        Cart cart = getOrCreateCart(userEmail);
        cart.getItems().removeIf(item -> item.getId().equals(itemId));
        return mapToResponse(cartRepository.save(cart));
    }

    private Cart getOrCreateCart(String userEmail) {
        return cartRepository.findByUserEmail(userEmail)
                .orElseGet(() -> {
                    User user = userRepository.findByEmail(userEmail)
                            .orElseThrow(() -> new IllegalArgumentException("User not found"));
                    Cart newCart = new Cart();
                    newCart.setUser(user);
                    return cartRepository.save(newCart);
                });
    }

    private CartResponse mapToResponse(Cart cart) {
        List<CartResponse.ItemDto> items = cart.getItems().stream()
                .map(item -> new CartResponse.ItemDto(
                        item.getId(),
                        item.getProduct().getId(),
                        item.getProduct().getName(),
                        item.getProduct().getPrice(),
                        item.getQuantity(),
                        item.getSubtotal()
                ))
                .toList();

        BigDecimal total = items.stream()
                .map(CartResponse.ItemDto::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new CartResponse(cart.getId(), items, total);
    }
}