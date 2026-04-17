package com.society.management.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CheckOutRequest {
    @NotNull
    private Long visitLogId;
    private String guardNotes;
}
