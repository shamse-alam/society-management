package com.society.management.dto;

import com.society.management.entity.Property;
import lombok.Data;

@Data
public class PropertyResponse {
    private Long id;
    private String unitNumber;
    private String ownerName;
    private String status;
    private String tenantName;
    private String tenantPhone;
    private Integer areaInSqFt;
    private String propertyType;
    private String description;
    private String createdAt;

    public static PropertyResponse from(Property property) {
        PropertyResponse r = new PropertyResponse();
        r.setId(property.getId());
        r.setUnitNumber(property.getUnitNumber());
        r.setOwnerName(property.getOwnerName());
        r.setStatus(property.getStatus().name());
        r.setTenantName(property.getTenantName());
        r.setTenantPhone(property.getTenantPhone());
        r.setAreaInSqFt(property.getAreaInSqFt());
        r.setPropertyType(property.getPropertyType());
        r.setDescription(property.getDescription());
        r.setCreatedAt(property.getCreatedAt() != null ? property.getCreatedAt().toString() : null);
        return r;
    }
}
