package com.society.management.dto;

import com.society.management.entity.Amenity;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class AmenityResponse {
    private Long id;
    private String name;
    private String description;
    private BigDecimal chargePerDay;
    private boolean available;
    private int totalUnits;

    public static AmenityResponse from(Amenity a) {
        AmenityResponse r = new AmenityResponse();
        r.setId(a.getId());
        r.setName(a.getName());
        r.setDescription(a.getDescription());
        r.setChargePerDay(a.getChargePerDay());
        r.setAvailable(a.isAvailable());
        r.setTotalUnits(a.getTotalUnits());
        return r;
    }
}
