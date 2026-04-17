package com.society.management.dto;

import com.society.management.entity.Property;
import com.society.management.entity.PropertyHistory;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Data
public class PropertyDetailResponse {
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
    private List<TimelineEntry> ownerTimeline;
    private List<TimelineEntry> tenantTimeline;

    @Data
    @AllArgsConstructor
    public static class TimelineEntry {
        private String name;
        private String phone; // for tenants
        private String startDate;
        private String endDate; // null if active
        private boolean active;
    }

    public static PropertyDetailResponse from(Property property, List<PropertyHistory> history) {
        PropertyDetailResponse r = new PropertyDetailResponse();
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

        r.setOwnerTimeline(buildOwnerTimeline(property, history));
        r.setTenantTimeline(buildTenantTimeline(property, history));

        return r;
    }

    private static List<TimelineEntry> buildOwnerTimeline(Property property, List<PropertyHistory> history) {
        // Get owner changes sorted by changedAt ascending
        List<PropertyHistory> ownerChanges = history.stream()
                .filter(h -> "OWNER_CHANGE".equals(h.getChangeType()))
                .sorted(Comparator.comparing(PropertyHistory::getChangedAt))
                .collect(Collectors.toList());

        List<TimelineEntry> timeline = new ArrayList<>();
        String propertyCreated = property.getCreatedAt() != null ? property.getCreatedAt().toLocalDate().toString() : null;

        if (ownerChanges.isEmpty()) {
            // No changes — current owner is the only one
            if (property.getOwnerName() != null && !property.getOwnerName().isEmpty()) {
                timeline.add(new TimelineEntry(property.getOwnerName(), null, propertyCreated, null, true));
            }
        } else {
            // First owner: from property creation to first change
            String firstOwner = ownerChanges.get(0).getPreviousValue();
            String firstEnd = ownerChanges.get(0).getChangedAt().toLocalDate().toString();
            if (firstOwner != null && !firstOwner.isEmpty()) {
                timeline.add(new TimelineEntry(firstOwner, null, propertyCreated, firstEnd, false));
            }

            // Middle owners: from each change to the next
            for (int i = 0; i < ownerChanges.size() - 1; i++) {
                String name = ownerChanges.get(i).getNewValue();
                String start = ownerChanges.get(i).getChangedAt().toLocalDate().toString();
                String end = ownerChanges.get(i + 1).getChangedAt().toLocalDate().toString();
                if (name != null && !name.isEmpty()) {
                    timeline.add(new TimelineEntry(name, null, start, end, false));
                }
            }

            // Current owner: from last change, still active
            PropertyHistory last = ownerChanges.get(ownerChanges.size() - 1);
            String currentName = last.getNewValue();
            String currentStart = last.getChangedAt().toLocalDate().toString();
            if (currentName != null && !currentName.isEmpty()) {
                timeline.add(new TimelineEntry(currentName, null, currentStart, null, true));
            }
        }

        // Reverse so active (current) is on top
        java.util.Collections.reverse(timeline);
        return timeline;
    }

    private static List<TimelineEntry> buildTenantTimeline(Property property, List<PropertyHistory> history) {
        List<PropertyHistory> tenantChanges = history.stream()
                .filter(h -> "TENANT_CHANGE".equals(h.getChangeType()))
                .sorted(Comparator.comparing(PropertyHistory::getChangedAt))
                .collect(Collectors.toList());

        List<TimelineEntry> timeline = new ArrayList<>();

        if (tenantChanges.isEmpty()) {
            // No changes — current tenant if any
            if (property.getTenantName() != null && !property.getTenantName().isEmpty()) {
                timeline.add(new TimelineEntry(property.getTenantName(), property.getTenantPhone(), null, null, true));
            }
        } else {
            // First tenant
            String firstName = tenantChanges.get(0).getPreviousValue();
            String firstPhone = tenantChanges.get(0).getPreviousPhone();
            String firstEnd = tenantChanges.get(0).getChangedAt().toLocalDate().toString();
            if (firstName != null && !firstName.isEmpty()) {
                timeline.add(new TimelineEntry(firstName, firstPhone, null, firstEnd, false));
            }

            // Middle tenants
            for (int i = 0; i < tenantChanges.size() - 1; i++) {
                String name = tenantChanges.get(i).getNewValue();
                String phone = tenantChanges.get(i).getNewPhone();
                String start = tenantChanges.get(i).getChangedAt().toLocalDate().toString();
                String end = tenantChanges.get(i + 1).getChangedAt().toLocalDate().toString();
                if (name != null && !name.isEmpty()) {
                    timeline.add(new TimelineEntry(name, phone, start, end, false));
                }
            }

            // Current tenant
            PropertyHistory last = tenantChanges.get(tenantChanges.size() - 1);
            String currentName = last.getNewValue();
            String currentPhone = last.getNewPhone();
            String currentStart = last.getChangedAt().toLocalDate().toString();
            boolean isActive = property.getTenantName() != null && property.getTenantName().equals(currentName);
            if (currentName != null && !currentName.isEmpty()) {
                timeline.add(new TimelineEntry(currentName, currentPhone, currentStart, isActive ? null : currentStart, isActive));
            }
        }

        java.util.Collections.reverse(timeline);
        return timeline;
    }
}
