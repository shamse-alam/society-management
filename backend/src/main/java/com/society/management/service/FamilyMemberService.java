package com.society.management.service;

import com.society.management.dto.FamilyMemberRequest;
import com.society.management.dto.FamilyMemberResponse;
import com.society.management.entity.FamilyMember;
import com.society.management.entity.User;
import com.society.management.entity.Property;
import com.society.management.repository.FamilyMemberRepository;
import com.society.management.repository.UserRepository;
import com.society.management.repository.PropertyRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;

@Service
public class FamilyMemberService {

    private final FamilyMemberRepository familyMemberRepository;
    private final UserRepository userRepository;
    private final PropertyRepository propertyRepository;

    @Value("${app.upload-dir:./uploads}")
    private String uploadDir;

    public FamilyMemberService(FamilyMemberRepository familyMemberRepository,
                                UserRepository userRepository,
                                PropertyRepository propertyRepository) {
        this.familyMemberRepository = familyMemberRepository;
        this.userRepository = userRepository;
        this.propertyRepository = propertyRepository;
    }

    public List<FamilyMemberResponse> getAllMembers() {
        return familyMemberRepository.findByActiveTrueOrderByPropertyUnitNumberAscCreatedAtAsc()
                .stream().map(FamilyMemberResponse::from).toList();
    }

    public List<FamilyMemberResponse> getMembersByProperty(String unitNumber) {
        return familyMemberRepository.findByPropertyUnitNumberAndActiveTrueOrderByCreatedAtAsc(unitNumber)
                .stream().map(FamilyMemberResponse::from).toList();
    }

    public List<FamilyMemberResponse> getMyHousehold(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return familyMemberRepository.findByPropertyUnitNumberAndActiveTrueOrderByCreatedAtAsc(user.getUnitNumber())
                .stream().map(FamilyMemberResponse::from).toList();
    }

    public FamilyMemberResponse addMember(FamilyMemberRequest req, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        String unitNum = req.getUnitNumber() != null ? req.getUnitNumber() : user.getUnitNumber();
        Property property = propertyRepository.findByUnitNumber(unitNum)
                .orElseThrow(() -> new RuntimeException("Property not found"));

        FamilyMember fm = FamilyMember.builder()
                .property(property)
                .addedBy(user)
                .name(req.getName())
                .relation(req.getRelation())
                .phone(req.getPhone())
                .email(req.getEmail())
                .canApproveVisitors(req.isCanApproveVisitors())
                .build();
        return FamilyMemberResponse.from(familyMemberRepository.save(fm));
    }

    public FamilyMemberResponse updateMember(Long id, FamilyMemberRequest req) {
        FamilyMember fm = familyMemberRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Family member not found"));
        fm.setName(req.getName());
        fm.setRelation(req.getRelation());
        fm.setPhone(req.getPhone());
        fm.setEmail(req.getEmail());
        fm.setCanApproveVisitors(req.isCanApproveVisitors());
        return FamilyMemberResponse.from(familyMemberRepository.save(fm));
    }

    public void deactivateMember(Long id) {
        FamilyMember fm = familyMemberRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Family member not found"));
        fm.setActive(false);
        familyMemberRepository.save(fm);
    }

    public FamilyMemberResponse uploadPhoto(Long id, MultipartFile file) {
        FamilyMember fm = familyMemberRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Family member not found"));
        try {
            Path uploadPath = Paths.get(uploadDir, "family-members");
            Files.createDirectories(uploadPath);

            String originalFilename = file.getOriginalFilename();
            String extension = originalFilename != null && originalFilename.contains(".")
                    ? originalFilename.substring(originalFilename.lastIndexOf("."))
                    : ".jpg";
            String filename = "fm_" + id + "_" + UUID.randomUUID().toString().substring(0, 8) + extension;

            Path filePath = uploadPath.resolve(filename);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            fm.setPhotoUrl("/api/uploads/family-members/" + filename);
            return FamilyMemberResponse.from(familyMemberRepository.save(fm));
        } catch (IOException e) {
            throw new RuntimeException("Failed to upload photo: " + e.getMessage());
        }
    }

    public Path getPhotoPath(String filename) {
        return Paths.get(uploadDir, "family-members", filename);
    }
}
