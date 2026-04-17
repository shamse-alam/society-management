package com.society.management.dto;

import com.society.management.entity.SocietyConfig;
import lombok.Data;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Data
public class SocietyConfigResponse {
    private Long id;
    private String societyName;
    private String tagline;
    private String logoUrl;
    private String address;
    private String phone;
    private String email;
    private String gstin;
    private String registrationNumber;
    private List<String> propertyTypes;
    private String propertyLabel;

    public static SocietyConfigResponse from(SocietyConfig config) {
        SocietyConfigResponse r = new SocietyConfigResponse();
        r.setId(config.getId());
        r.setSocietyName(config.getSocietyName());
        r.setTagline(config.getTagline());
        r.setLogoUrl(config.getLogoUrl());
        r.setAddress(config.getAddress());
        r.setPhone(config.getPhone());
        r.setEmail(config.getEmail());
        r.setGstin(config.getGstin());
        r.setRegistrationNumber(config.getRegistrationNumber());
        if (config.getPropertyTypes() != null && !config.getPropertyTypes().isBlank()) {
            r.setPropertyTypes(Arrays.stream(config.getPropertyTypes().split(","))
                    .map(String::trim).filter(s -> !s.isEmpty()).collect(Collectors.toList()));
        } else {
            r.setPropertyTypes(Collections.emptyList());
        }
        r.setPropertyLabel(config.getPropertyLabel());
        return r;
    }
}
