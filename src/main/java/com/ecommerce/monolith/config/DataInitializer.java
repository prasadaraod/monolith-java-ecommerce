package com.ecommerce.monolith.config;

import com.ecommerce.monolith.model.Product;
import com.ecommerce.monolith.model.User;
import com.ecommerce.monolith.repository.ProductRepository;
import com.ecommerce.monolith.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.util.List;

@Configuration
public class DataInitializer {

    @Bean
    public CommandLineRunner initDatabase(
            UserRepository userRepository,
            ProductRepository productRepository,
            PasswordEncoder passwordEncoder) {
        return args -> {
            // Seed Admin User if not present
            String adminEmail = "admin@ecommerce.com";
            if (!userRepository.existsByEmail(adminEmail)) {
                User admin = new User();
                admin.setFullName("Store Administrator");
                admin.setEmail(adminEmail);
                admin.setPassword(passwordEncoder.encode("Admin@123456"));
                admin.setRole(User.Role.ADMIN);
                userRepository.save(admin);
            }

            // Seed Sample Products if database catalog has <= 1 item
            if (productRepository.count() <= 1) {
                Product p1 = new Product();
                p1.setName("Wireless Ergonomic Mouse");
                p1.setDescription("2.4GHz rechargeable ergonomic vertical mouse");
                p1.setPrice(BigDecimal.valueOf(1499.00));
                p1.setStockQuantity(50);

                Product p2 = new Product();
                p2.setName("7-in-1 USB-C Hub");
                p2.setDescription("4K HDMI, 100W PD charging, 3x USB 3.0, SD card reader");
                p2.setPrice(BigDecimal.valueOf(2299.00));
                p2.setStockQuantity(30);

                Product p3 = new Product();
                p3.setName("ANC Wireless Headphones");
                p3.setDescription("Active noise cancelling with 40-hour battery life");
                p3.setPrice(BigDecimal.valueOf(5999.00));
                p3.setStockQuantity(20);

                Product p4 = new Product();
                p4.setName("Aluminum Laptop Stand");
                p4.setDescription("Adjustable ergonomic cooling riser for laptops up to 17 inches");
                p4.setPrice(BigDecimal.valueOf(1199.00));
                p4.setStockQuantity(45);

                Product p5 = new Product();
                p5.setName("Ultra-Wide Monitor 34\"");
                p5.setDescription("144Hz WQHD curved IPS display with HDR400");
                p5.setPrice(BigDecimal.valueOf(32999.00));
                p5.setStockQuantity(10);

                productRepository.saveAll(List.of(p1, p2, p3, p4, p5));
            }
        };
    }
}