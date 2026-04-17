package com.society.management.dto;

import com.society.management.entity.DeliveryLog;
import lombok.Data;

@Data
public class DeliveryLogResponse {
    private Long id;
    private String unitNumber;
    private String residentName;
    private String deliveryService;
    private String description;
    private String status;
    private String receivedBy;
    private String receivedAt;
    private String createdAt;

    public static DeliveryLogResponse from(DeliveryLog dl) {
        DeliveryLogResponse r = new DeliveryLogResponse();
        r.setId(dl.getId());
        r.setUnitNumber(dl.getProperty() != null ? dl.getProperty().getUnitNumber() : dl.getUser().getUnitNumber());
        r.setResidentName(dl.getUser().getFullName());
        r.setDeliveryService(dl.getDeliveryService());
        r.setDescription(dl.getDescription());
        r.setStatus(dl.getStatus().name());
        r.setReceivedBy(dl.getReceivedBy());
        r.setReceivedAt(dl.getReceivedAt() != null ? dl.getReceivedAt().toString() : null);
        r.setCreatedAt(dl.getCreatedAt() != null ? dl.getCreatedAt().toString() : null);
        return r;
    }
}
