package com.society.management.service;

import com.society.management.dto.DocumentResponse;
import com.society.management.entity.DocumentCategory;
import com.society.management.entity.SocietyDocument;
import com.society.management.entity.User;
import com.society.management.repository.SocietyDocumentRepository;
import com.society.management.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;

@Service
public class DocumentService {

    private final SocietyDocumentRepository documentRepository;
    private final UserRepository userRepository;
    private static final String UPLOAD_DIR = "./uploads/documents/";

    public DocumentService(SocietyDocumentRepository documentRepository, UserRepository userRepository) {
        this.documentRepository = documentRepository;
        this.userRepository = userRepository;
    }

    public List<DocumentResponse> getAllDocuments() {
        return documentRepository.findByActiveTrueOrderByCreatedAtDesc()
                .stream().map(DocumentResponse::from).toList();
    }

    public List<DocumentResponse> getDocumentsByCategory(String category) {
        return documentRepository.findByCategoryAndActiveTrueOrderByCreatedAtDesc(DocumentCategory.valueOf(category))
                .stream().map(DocumentResponse::from).toList();
    }

    public DocumentResponse uploadDocument(String title, String description, String category, MultipartFile file, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String fileName = UUID.randomUUID() + "_" + file.getOriginalFilename();
        try {
            Path dir = Paths.get(UPLOAD_DIR);
            Files.createDirectories(dir);
            Files.copy(file.getInputStream(), dir.resolve(fileName));
        } catch (IOException e) {
            throw new RuntimeException("Failed to upload file");
        }

        SocietyDocument doc = SocietyDocument.builder()
                .title(title)
                .description(description)
                .category(DocumentCategory.valueOf(category))
                .fileUrl("/api/uploads/documents/" + fileName)
                .fileName(file.getOriginalFilename())
                .fileSize(file.getSize())
                .uploadedBy(user)
                .build();
        return DocumentResponse.from(documentRepository.save(doc));
    }

    public DocumentResponse updateDocument(Long id, String title, String description, String category) {
        SocietyDocument doc = documentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Document not found"));
        doc.setTitle(title);
        doc.setDescription(description);
        doc.setCategory(DocumentCategory.valueOf(category));
        return DocumentResponse.from(documentRepository.save(doc));
    }

    public void deleteDocument(Long id) {
        SocietyDocument doc = documentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Document not found"));
        doc.setActive(false);
        documentRepository.save(doc);
    }
}
