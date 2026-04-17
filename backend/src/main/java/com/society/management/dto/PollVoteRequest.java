package com.society.management.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class PollVoteRequest {
    @NotNull
    private Long optionId;
}
