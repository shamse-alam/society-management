package com.society.management.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class PenaltyRequest {
    @NotNull
    private BigDecimal annualRate; // e.g. 18 for 18% per annum
}
