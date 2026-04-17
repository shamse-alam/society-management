package com.society.management.service;

import com.society.management.dto.SocietyConfigRequest;
import com.society.management.dto.SocietyConfigResponse;
import com.society.management.entity.SocietyConfig;
import com.society.management.repository.SocietyConfigRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class SocietyConfigService {

    private final SocietyConfigRepository repository;
    private static final String UPLOAD_DIR = "./uploads/society/";

    public SocietyConfigService(SocietyConfigRepository repository) {
        this.repository = repository;
    }

    public SocietyConfig getOrCreate() {
        return repository.findAll().stream().findFirst()
                .orElseGet(() -> repository.save(SocietyConfig.builder()
                        .societyName("The Courtyard")
                        .tagline("Society Management")
                        .propertyTypes("Simplex,Duplex,Triplex,Quadraplex")
                        .propertyLabel("Villa")
                        .build()));
    }

    public SocietyConfigResponse getConfig() {
        return SocietyConfigResponse.from(getOrCreate());
    }

    public SocietyConfigResponse updateConfig(SocietyConfigRequest request) {
        SocietyConfig config = getOrCreate();
        if (request.getSocietyName() != null) config.setSocietyName(request.getSocietyName());
        if (request.getTagline() != null) config.setTagline(request.getTagline());
        if (request.getAddress() != null) config.setAddress(request.getAddress());
        if (request.getPhone() != null) config.setPhone(request.getPhone());
        if (request.getEmail() != null) config.setEmail(request.getEmail());
        if (request.getGstin() != null) config.setGstin(request.getGstin());
        if (request.getRegistrationNumber() != null) config.setRegistrationNumber(request.getRegistrationNumber());
        if (request.getPropertyTypes() != null) config.setPropertyTypes(String.join(",", request.getPropertyTypes()));
        if (request.getPropertyLabel() != null) config.setPropertyLabel(request.getPropertyLabel());
        return SocietyConfigResponse.from(repository.save(config));
    }

    public SocietyConfigResponse uploadLogo(MultipartFile file) {
        SocietyConfig config = getOrCreate();
        try {
            Path dir = Paths.get(UPLOAD_DIR);
            Files.createDirectories(dir);
            String ext = getExtension(file.getOriginalFilename());
            String filename = "logo-" + UUID.randomUUID().toString().substring(0, 8) + ext;
            Files.copy(file.getInputStream(), dir.resolve(filename), StandardCopyOption.REPLACE_EXISTING);
            config.setLogoUrl("/api/uploads/society/" + filename);
            return SocietyConfigResponse.from(repository.save(config));
        } catch (IOException e) {
            throw new RuntimeException("Failed to upload logo", e);
        }
    }

    private String getExtension(String filename) {
        if (filename == null) return ".png";
        int dot = filename.lastIndexOf('.');
        return dot >= 0 ? filename.substring(dot) : ".png";
    }
}
