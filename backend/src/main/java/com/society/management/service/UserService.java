package com.society.management.service;

import com.society.management.dto.UpdateUserRequest;
import com.society.management.dto.UserResponse;
import com.society.management.entity.User;
import com.society.management.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.upload.dir:./uploads}")
    private String uploadDir;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(UserResponse::from)
                .collect(Collectors.toList());
    }

    public UserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return UserResponse.from(user);
    }

    public UserResponse updateUser(Long id, UpdateUserRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (request.getFirstName() != null) user.setFirstName(request.getFirstName());
        if (request.getLastName() != null) user.setLastName(request.getLastName());
        if (request.getEmail() != null) user.setEmail(request.getEmail());
        if (request.getPhone() != null) user.setPhone(request.getPhone());
        if (request.getAddress() != null) user.setAddress(request.getAddress());
        if (request.getUnitNumber() != null) user.setUnitNumber(request.getUnitNumber());
        if (request.getEnabled() != null) user.setEnabled(request.getEnabled());

        // Multi-role update
        if (request.getRoles() != null && !request.getRoles().isEmpty()) {
            user.setRoles(String.join(",", request.getRoles()));
        } else if (request.getRole() != null) {
            user.setRoles(request.getRole());
        }

        // Designation
        if (request.getDesignation() != null) user.setDesignation(request.getDesignation().isBlank() ? null : request.getDesignation());
        if (request.getDesignationSince() != null) user.setDesignationSince(request.getDesignationSince().isBlank() ? null : LocalDate.parse(request.getDesignationSince()));
        if (request.getDesignationTill() != null) user.setDesignationTill(request.getDesignationTill().isBlank() ? null : LocalDate.parse(request.getDesignationTill()));

        user = userRepository.save(user);
        return UserResponse.from(user);
    }

    public void deleteUser(Long id) {
        if (!userRepository.existsById(id)) {
            throw new RuntimeException("User not found");
        }
        userRepository.deleteById(id);
    }

    public UserResponse uploadProfileImage(Long id, MultipartFile file) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        try {
            Path uploadPath = Paths.get(uploadDir, "profiles");
            Files.createDirectories(uploadPath);

            String originalFilename = file.getOriginalFilename();
            String extension = originalFilename != null && originalFilename.contains(".")
                    ? originalFilename.substring(originalFilename.lastIndexOf("."))
                    : ".jpg";
            String filename = "user_" + id + "_" + UUID.randomUUID().toString().substring(0, 8) + extension;

            Path filePath = uploadPath.resolve(filename);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            user.setProfileImage("/api/uploads/profiles/" + filename);
            user = userRepository.save(user);

            return UserResponse.from(user);
        } catch (IOException e) {
            throw new RuntimeException("Failed to upload image: " + e.getMessage());
        }
    }

    public UserResponse uploadProfileImageByUsername(String username, MultipartFile file) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return uploadProfileImage(user.getId(), file);
    }

    public Path getProfileImagePath(String filename) {
        return Paths.get(uploadDir, "profiles", filename);
    }

    public void adminResetPassword(Long id, String newPassword) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setPasswordResetToken(null);
        user.setPasswordResetTokenExpiry(null);
        userRepository.save(user);
    }

    public List<UserResponse> getCommitteeMembers() {
        return userRepository.findAll().stream()
                .filter(u -> u.getDesignation() != null && !u.getDesignation().isBlank())
                .map(UserResponse::from)
                .collect(Collectors.toList());
    }
}
