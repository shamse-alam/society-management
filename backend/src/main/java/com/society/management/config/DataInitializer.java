package com.society.management.config;

import com.society.management.entity.*;
import com.society.management.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.Statement;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final DataSource dataSource;

    public DataInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder,
                           DataSource dataSource) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.dataSource = dataSource;
    }

    @Override
    public void run(String... args) {
        dropStaleConstraints();
        seedUsers();
    }

    private void dropStaleConstraints() {
        // payment_type was converted from enum to String — drop the old Hibernate check constraint
        try (Connection conn = dataSource.getConnection();
             Statement stmt = conn.createStatement()) {
            stmt.execute("ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_payment_type_check");
            log.info("Dropped stale payments_payment_type_check constraint (or it did not exist)");
        } catch (Exception e) {
            log.warn("Could not drop payments_payment_type_check: {}", e.getMessage());
        }
    }

    private void seedUsers() {
        if (userRepository.count() > 0) return;

        String pwd = passwordEncoder.encode("welcome");

        userRepository.save(User.builder()
                .username("admin").password(pwd).firstName("System").lastName("Administrator")
                .email("admin@courtyard.com").phone("+91-9000000000").address("Society Office")
                .unitNumber("ADMIN").roles("ADMIN").build());
        log.info("Admin created - username: admin, password: welcome");
    }
}
