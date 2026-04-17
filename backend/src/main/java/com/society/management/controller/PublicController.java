package com.society.management.controller;

import com.society.management.dto.SocietyConfigResponse;
import com.society.management.service.SocietyConfigService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public")
public class PublicController {

    private final SocietyConfigService societyConfigService;

    public PublicController(SocietyConfigService societyConfigService) {
        this.societyConfigService = societyConfigService;
    }

    @GetMapping("/society-config")
    public ResponseEntity<SocietyConfigResponse> getSocietyConfig() {
        return ResponseEntity.ok(societyConfigService.getConfig());
    }
}
