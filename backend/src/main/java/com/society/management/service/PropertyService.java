package com.society.management.service;

import com.society.management.dto.PropertyDetailResponse;
import com.society.management.dto.PropertyRequest;
import com.society.management.dto.PropertyResponse;
import com.society.management.entity.Property;
import com.society.management.entity.PropertyHistory;
import com.society.management.entity.PropertyStatus;
import com.society.management.entity.User;
import com.society.management.repository.PropertyHistoryRepository;
import com.society.management.repository.PropertyRepository;
import com.society.management.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class PropertyService {

    private final PropertyRepository propertyRepository;
    private final PropertyHistoryRepository propertyHistoryRepository;
    private final UserRepository userRepository;

    public PropertyService(PropertyRepository propertyRepository, PropertyHistoryRepository propertyHistoryRepository, UserRepository userRepository) {
        this.propertyRepository = propertyRepository;
        this.propertyHistoryRepository = propertyHistoryRepository;
        this.userRepository = userRepository;
    }

    private void linkOwner(String unitNumber, PropertyRequest request) {
        if (request.getOwnerId() == null || unitNumber == null) return;
        User owner = userRepository.findById(request.getOwnerId()).orElse(null);
        if (owner == null) return;
        // Unlink any previous user from this unit
        userRepository.findFirstByUnitNumber(unitNumber).ifPresent(prev -> {
            if (!prev.getId().equals(owner.getId())) {
                prev.setUnitNumber(null);
                userRepository.save(prev);
            }
        });
        owner.setUnitNumber(unitNumber);
        userRepository.save(owner);
        // Auto-fill ownerName from the user if not explicitly provided
        if (request.getOwnerName() == null || request.getOwnerName().isBlank()) {
            request.setOwnerName(owner.getFullName());
        }
    }

    public List<PropertyResponse> getAllProperties() {
        return propertyRepository.findAll().stream()
                .map(PropertyResponse::from)
                .collect(Collectors.toList());
    }

    public PropertyResponse getPropertyById(Long id) {
        Property property = propertyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Property not found"));
        return PropertyResponse.from(property);
    }

    public PropertyDetailResponse getPropertyDetail(Long id) {
        Property property = propertyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Property not found"));
        List<PropertyHistory> history = propertyHistoryRepository.findByPropertyIdOrderByChangedAtDesc(property.getId());
        return PropertyDetailResponse.from(property, history);
    }

    public PropertyResponse createProperty(PropertyRequest request) {
        if (propertyRepository.existsByUnitNumber(request.getUnitNumber())) {
            throw new RuntimeException("Property number already exists");
        }

        Property property = Property.builder()
                .unitNumber(request.getUnitNumber())
                .ownerName(request.getOwnerName())
                .status(request.getStatus() != null ? PropertyStatus.valueOf(request.getStatus()) : PropertyStatus.VACANT)
                .tenantName(request.getTenantName())
                .tenantPhone(request.getTenantPhone())
                .areaInSqFt(request.getAreaInSqFt())
                .propertyType(request.getPropertyType())
                .description(request.getDescription())
                .build();

        property = propertyRepository.save(property);
        linkOwner(property.getUnitNumber(), request);
        // Re-save if ownerName was auto-filled from user
        if (request.getOwnerName() != null && !request.getOwnerName().equals(property.getOwnerName())) {
            property.setOwnerName(request.getOwnerName());
            property = propertyRepository.save(property);
        }
        return PropertyResponse.from(property);
    }

    public PropertyResponse updateProperty(Long id, PropertyRequest request) {
        Property property = propertyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Property not found"));

        // Track owner change
        if (request.getOwnerName() != null && !Objects.equals(property.getOwnerName(), request.getOwnerName())) {
            propertyHistoryRepository.save(PropertyHistory.builder()
                    .propertyId(property.getId())
                    .changeType("OWNER_CHANGE")
                    .previousValue(property.getOwnerName())
                    .newValue(request.getOwnerName())
                    .build());
        }

        // Track tenant change
        if (request.getTenantName() != null && !Objects.equals(property.getTenantName(), request.getTenantName())) {
            propertyHistoryRepository.save(PropertyHistory.builder()
                    .propertyId(property.getId())
                    .changeType("TENANT_CHANGE")
                    .previousValue(property.getTenantName())
                    .newValue(request.getTenantName())
                    .previousPhone(property.getTenantPhone())
                    .newPhone(request.getTenantPhone())
                    .build());
        } else if (request.getTenantPhone() != null && !Objects.equals(property.getTenantPhone(), request.getTenantPhone())) {
            // Phone changed but name same — still track
            propertyHistoryRepository.save(PropertyHistory.builder()
                    .propertyId(property.getId())
                    .changeType("TENANT_CHANGE")
                    .previousValue(property.getTenantName())
                    .newValue(request.getTenantName() != null ? request.getTenantName() : property.getTenantName())
                    .previousPhone(property.getTenantPhone())
                    .newPhone(request.getTenantPhone())
                    .build());
        }

        if (request.getUnitNumber() != null) property.setUnitNumber(request.getUnitNumber());
        if (request.getOwnerName() != null) property.setOwnerName(request.getOwnerName());
        if (request.getStatus() != null) property.setStatus(PropertyStatus.valueOf(request.getStatus()));
        if (request.getTenantName() != null) property.setTenantName(request.getTenantName());
        if (request.getTenantPhone() != null) property.setTenantPhone(request.getTenantPhone());
        if (request.getAreaInSqFt() != null) property.setAreaInSqFt(request.getAreaInSqFt());
        if (request.getPropertyType() != null) property.setPropertyType(request.getPropertyType());
        if (request.getDescription() != null) property.setDescription(request.getDescription());

        property = propertyRepository.save(property);
        linkOwner(property.getUnitNumber(), request);
        // Re-save if ownerName was auto-filled from user
        if (request.getOwnerName() != null && !Objects.equals(request.getOwnerName(), property.getOwnerName())) {
            property.setOwnerName(request.getOwnerName());
            property = propertyRepository.save(property);
        }
        return PropertyResponse.from(property);
    }

    public void deleteProperty(Long id) {
        if (!propertyRepository.existsById(id)) {
            throw new RuntimeException("Property not found");
        }
        propertyRepository.deleteById(id);
    }

    public List<PropertyResponse> getPropertiesByStatus(String status) {
        return propertyRepository.findByStatus(PropertyStatus.valueOf(status)).stream()
                .map(PropertyResponse::from)
                .collect(Collectors.toList());
    }
}
