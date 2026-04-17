package com.society.management.dto;

import lombok.Data;

@Data
public class VisitorStatsResponse {
    private long todayCheckIns;
    private long todayCheckOuts;
    private long currentlyInside;
    private long expectedToday;
    private long dailyHelpInToday;
    private long pendingDeliveries;
    private long awaitingApproval;
}
