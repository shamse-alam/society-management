package com.society.management.service;

import com.society.management.dto.VendorBankAccountRequest;
import com.society.management.dto.VendorRequest;
import com.society.management.dto.VendorResponse;
import com.society.management.entity.Vendor;
import com.society.management.entity.VendorBankAccount;
import com.society.management.entity.VendorType;
import com.society.management.repository.VendorRepository;
import org.springframework.beans.factory.annotation.Value;
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
public class VendorService {

    private final VendorRepository vendorRepository;

    @Value("${app.upload.dir:./uploads}")
    private String uploadDir;

    public VendorService(VendorRepository vendorRepository) {
        this.vendorRepository = vendorRepository;
    }

    public List<VendorResponse> getAllVendors() {
        return vendorRepository.findAllByOrderByNameAsc().stream()
                .map(VendorResponse::from)
                .collect(Collectors.toList());
    }

    public VendorResponse getVendorById(Long id) {
        Vendor vendor = vendorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vendor not found"));
        return VendorResponse.from(vendor);
    }

    public List<VendorResponse> getActiveVendors() {
        return vendorRepository.findByActiveTrueOrderByNameAsc().stream()
                .map(VendorResponse::from)
                .collect(Collectors.toList());
    }

    public List<VendorResponse> getVendorsByType(String vendorType) {
        return vendorRepository.findByVendorTypeAndActiveTrueOrderByNameAsc(VendorType.valueOf(vendorType))
                .stream().map(VendorResponse::from).collect(Collectors.toList());
    }

    public VendorResponse createVendor(VendorRequest request) {
        Vendor vendor = Vendor.builder()
                .name(request.getName())
                .category(request.getCategory())
                .phone(request.getPhone())
                .email(request.getEmail())
                .address(request.getAddress())
                .vendorType(request.getVendorType() != null && !request.getVendorType().isBlank() ? VendorType.valueOf(request.getVendorType()) : VendorType.OTHER)
                .monthlyAmount(request.getMonthlyAmount())
                .contractStartDate(request.getContractStartDate() != null && !request.getContractStartDate().isBlank() ? LocalDate.parse(request.getContractStartDate()) : null)
                .contractEndDate(request.getContractEndDate() != null && !request.getContractEndDate().isBlank() ? LocalDate.parse(request.getContractEndDate()) : null)
                .gstNumber(request.getGstNumber())
                .build();
        syncBankAccounts(vendor, request.getBankAccounts());
        return VendorResponse.from(vendorRepository.save(vendor));
    }

    public VendorResponse updateVendor(Long id, VendorRequest request) {
        Vendor vendor = vendorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vendor not found"));
        vendor.setName(request.getName());
        vendor.setCategory(request.getCategory());
        vendor.setPhone(request.getPhone());
        vendor.setEmail(request.getEmail());
        vendor.setAddress(request.getAddress());
        if (request.getActive() != null) {
            vendor.setActive(request.getActive());
        }
        if (request.getVendorType() != null && !request.getVendorType().isBlank()) {
            vendor.setVendorType(VendorType.valueOf(request.getVendorType()));
        }
        vendor.setMonthlyAmount(request.getMonthlyAmount());
        vendor.setContractStartDate(request.getContractStartDate() != null && !request.getContractStartDate().isBlank() ? LocalDate.parse(request.getContractStartDate()) : null);
        vendor.setContractEndDate(request.getContractEndDate() != null && !request.getContractEndDate().isBlank() ? LocalDate.parse(request.getContractEndDate()) : null);
        vendor.setGstNumber(request.getGstNumber());
        syncBankAccounts(vendor, request.getBankAccounts());
        return VendorResponse.from(vendorRepository.save(vendor));
    }

    private void syncBankAccounts(Vendor vendor, List<VendorBankAccountRequest> accounts) {
        vendor.getBankAccounts().clear();
        if (accounts == null || accounts.isEmpty()) return;
        for (VendorBankAccountRequest req : accounts) {
            VendorBankAccount ba = VendorBankAccount.builder()
                    .vendor(vendor)
                    .accountHolderName(req.getAccountHolderName())
                    .accountNumber(req.getAccountNumber())
                    .ifscCode(req.getIfscCode())
                    .bankName(req.getBankName())
                    .branchName(req.getBranchName())
                    .build();
            vendor.getBankAccounts().add(ba);
        }
    }

    public void deleteVendor(Long id) {
        if (!vendorRepository.existsById(id)) {
            throw new RuntimeException("Vendor not found");
        }
        vendorRepository.deleteById(id);
    }

    public VendorResponse uploadLogo(Long id, MultipartFile file) {
        Vendor vendor = vendorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vendor not found"));
        try {
            Path uploadPath = Paths.get(uploadDir, "vendors");
            Files.createDirectories(uploadPath);
            String ext = "";
            String origName = file.getOriginalFilename();
            if (origName != null && origName.contains(".")) ext = origName.substring(origName.lastIndexOf("."));
            String filename = "vendor_" + id + "_" + UUID.randomUUID().toString().substring(0, 8) + ext;
            Files.copy(file.getInputStream(), uploadPath.resolve(filename), StandardCopyOption.REPLACE_EXISTING);
            vendor.setLogoImage("/api/uploads/vendors/" + filename);
            return VendorResponse.from(vendorRepository.save(vendor));
        } catch (IOException e) {
            throw new RuntimeException("Failed to upload logo: " + e.getMessage());
        }
    }

    public Path getLogoPath(String filename) {
        return Paths.get(uploadDir, "vendors", filename);
    }
}
