package com.society.management.repository;

import com.society.management.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    Optional<User> findByPasswordResetToken(String token);
    Optional<User> findFirstByUnitNumber(String unitNumber);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
}
