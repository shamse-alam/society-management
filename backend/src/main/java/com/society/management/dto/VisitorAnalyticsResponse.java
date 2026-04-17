package com.society.management.dto;

import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
public class VisitorAnalyticsResponse {

    private List<DailyCount> dailyTrend;
    private Map<String, Long> typeDistribution;
    private Map<Integer, Long> peakHours;
    private List<FrequentVisitor> frequentVisitors;
    private List<UnitCount> unitWiseCount;

    @Data
    public static class DailyCount {
        private String date;
        private long count;

        public DailyCount(String date, long count) {
            this.date = date;
            this.count = count;
        }
    }

    @Data
    public static class FrequentVisitor {
        private String name;
        private String phone;
        private long count;

        public FrequentVisitor(String name, String phone, long count) {
            this.name = name;
            this.phone = phone;
            this.count = count;
        }
    }

    @Data
    public static class UnitCount {
        private String unitNumber;
        private long count;

        public UnitCount(String unitNumber, long count) {
            this.unitNumber = unitNumber;
            this.count = count;
        }
    }
}
