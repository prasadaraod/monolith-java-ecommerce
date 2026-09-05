package com.ecommerce.monolith.repository;

import com.ecommerce.monolith.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByUserEmailOrderByCreatedAtDesc(String email);
}