package com.example.HMS_backend.dashboard.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RevenueTrendResponse {
    private List<String> labels;
    private List<BigDecimal> revenueData;
}
