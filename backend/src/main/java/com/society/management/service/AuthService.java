package com.society.management.service;

import com.society.management.dto.*;
import com.society.management.entity.Role;
import com.society.management.entity.User;
import com.society.management.repository.UserRepository;
import com.society.management.security.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    @Value("${app.password-reset.expiration-ms}")
    private long resetTokenExpirationMs;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    public AuthService(AuthenticationManager authenticationManager, JwtTokenProvider tokenProvider,
                       UserRepository userRepository, PasswordEncoder passwordEncoder,
                       EmailService emailService) {
        this.authenticationManager = authenticationManager;
        this.tokenProvider = tokenProvider;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
    }

    public LoginResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));

        String token = tokenProvider.generateToken(authentication);
        com.society.management.security.CustomUserDetails userDetails =
                (com.society.management.security.CustomUserDetails) authentication.getPrincipal();

        return new LoginResponse(token, userDetails.getUsername(),
                userDetails.getUser().getFirstName(), userDetails.getUser().getLastName(),
                userDetails.getUser().getFullName(), userDetails.getUser().getRole().name(),
                userDetails.getUser().getProfileImage());
    }

    public UserResponse registerUser(RegisterUserRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username already exists");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        String resetToken = UUID.randomUUID().toString();

        User user = User.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(UUID.randomUUID().toString()))
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .address(request.getAddress())
                .unitNumber(request.getUnitNumber())
                .role(request.getRole() != null && request.getRole().equals("ADMIN") ? Role.ADMIN : Role.USER)
                .passwordResetToken(resetToken)
                .passwordResetTokenExpiry(LocalDateTime.now().plusHours(1))
                .build();

        user = userRepository.save(user);

        emailService.sendWelcomeEmail(user.getEmail(), user.getFullName(), user.getUsername(), resetToken);

        UserResponse response = UserResponse.from(user);
        response.setPasswordResetLink(frontendUrl + "/reset-password?token=" + resetToken);
        return response;
    }

    public void forgotPassword(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("No account found with this email"));

        String resetToken = UUID.randomUUID().toString();
        user.setPasswordResetToken(resetToken);
        user.setPasswordResetTokenExpiry(LocalDateTime.now().plusSeconds(resetTokenExpirationMs / 1000));
        userRepository.save(user);

        emailService.sendPasswordResetEmail(email, resetToken);
    }

    public void resetPassword(PasswordResetRequest request) {
        User user = userRepository.findByPasswordResetToken(request.getToken())
                .orElseThrow(() -> new RuntimeException("Invalid reset token"));

        if (user.getPasswordResetTokenExpiry().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Reset token has expired");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setPasswordResetToken(null);
        user.setPasswordResetTokenExpiry(null);
        userRepository.save(user);
    }
}
