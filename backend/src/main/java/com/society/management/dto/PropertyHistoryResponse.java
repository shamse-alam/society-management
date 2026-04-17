package com.society.management.dto;

import com.society.management.entity.PropertyHistory;
import lombok.Data;

@Data
public class PropertyHistoryResponse {
    private Long id;
    private String changeType;
    private String previousValue;
    private String newValue;
    private String previousPhone;
    private String newPhone;
    private String changedAt;

    public static PropertyHistoryResponse from(PropertyHistory h) {
        PropertyHistoryResponse r = new PropertyHistoryResponse();
        r.setId(h.getId());
        r.setChangeType(h.getChangeType());
        r.setPreviousValue(h.getPreviousValue());
        r.setNewValue(h.getNewValue());
        r.setPreviousPhone(h.getPreviousPhone());
        r.setNewPhone(h.getNewPhone());
        r.setChangedAt(h.getChangedAt() != null ? h.getChangedAt().toString() : null);
        return r;
    }
}
