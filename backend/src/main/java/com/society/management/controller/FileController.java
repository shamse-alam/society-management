package com.society.management.controller;

import com.society.management.service.FamilyMemberService;
import com.society.management.service.UserService;
import com.society.management.service.VendorService;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.file.Path;

@RestController
@RequestMapping("/api/uploads")
public class FileController {

    private final UserService userService;
    private final VendorService vendorService;
    private final FamilyMemberService familyMemberService;

    public FileController(UserService userService, VendorService vendorService, FamilyMemberService familyMemberService) {
        this.userService = userService;
        this.vendorService = vendorService;
        this.familyMemberService = familyMemberService;
    }

    @GetMapping("/profiles/{filename}")
    public ResponseEntity<Resource> getProfileImage(@PathVariable String filename) {
        return serveFile(userService.getProfileImagePath(filename), filename);
    }

    @GetMapping("/vendors/{filename}")
    public ResponseEntity<Resource> getVendorLogo(@PathVariable String filename) {
        return serveFile(vendorService.getLogoPath(filename), filename);
    }

    @GetMapping("/family-members/{filename}")
    public ResponseEntity<Resource> getFamilyMemberPhoto(@PathVariable String filename) {
        return serveFile(familyMemberService.getPhotoPath(filename), filename);
    }

    @GetMapping("/complaints/{filename}")
    public ResponseEntity<Resource> getComplaintAttachment(@PathVariable String filename) {
        Path filePath = Path.of("./uploads/complaints").resolve(filename);
        return serveFile(filePath, filename);
    }

    @GetMapping("/documents/{filename}")
    public ResponseEntity<Resource> getDocument(@PathVariable String filename) {
        Path filePath = Path.of("./uploads/documents").resolve(filename);
        return serveFile(filePath, filename);
    }

    @GetMapping("/society/{filename}")
    public ResponseEntity<Resource> getSocietyLogo(@PathVariable String filename) {
        Path filePath = Path.of("./uploads/society").resolve(filename);
        return serveFile(filePath, filename);
    }

    @GetMapping("/bills/{filename}")
    public ResponseEntity<Resource> getBillAttachment(@PathVariable String filename) {
        Path filePath = Path.of("./uploads/bills").resolve(filename);
        return serveFile(filePath, filename);
    }

    private ResponseEntity<Resource> serveFile(Path filePath, String filename) {
        try {
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists() && resource.isReadable()) {
                String contentType = "application/octet-stream";
                if (filename.endsWith(".jpg") || filename.endsWith(".jpeg")) contentType = "image/jpeg";
                else if (filename.endsWith(".png")) contentType = "image/png";
                else if (filename.endsWith(".gif")) contentType = "image/gif";
                else if (filename.endsWith(".webp")) contentType = "image/webp";
                else if (filename.endsWith(".svg")) contentType = "image/svg+xml";
                else if (filename.endsWith(".pdf")) contentType = "application/pdf";
                else if (filename.endsWith(".doc") || filename.endsWith(".docx")) contentType = "application/msword";
                else if (filename.endsWith(".xls") || filename.endsWith(".xlsx")) contentType = "application/vnd.ms-excel";

                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(contentType))
                        .header(HttpHeaders.CACHE_CONTROL, "public, max-age=86400")
                        .body(resource);
            }
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
}
