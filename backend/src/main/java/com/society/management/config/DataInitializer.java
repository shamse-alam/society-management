package com.society.management.config;

import com.society.management.entity.*;
import com.society.management.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (userRepository.count() > 0) return;

        String pwd = passwordEncoder.encode("welcome");

        userRepository.save(User.builder()
                .username("admin").password(pwd).firstName("System").lastName("Administrator")
                .email("admin@courtyard.com").phone("+91-9000000000").address("Society Office")
                .unitNumber("ADMIN").role(Role.ADMIN).build());
        log.info("Admin created - username: admin, password: welcome");

        userRepository.save(User.builder()
                .username("guard").password(pwd).firstName("Security").lastName("Guard")
                .email("guard@courtyard.com").phone("+91-9000000001").address("Main Gate")
                .unitNumber("GATE").role(Role.GUARD).build());
        log.info("Guard created - username: guard, password: welcome");
    }
}
