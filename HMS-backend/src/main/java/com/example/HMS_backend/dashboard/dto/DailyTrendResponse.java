package com.example.HMS_backend.dashboard.dto;

import lombok.*;

import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DailyTrendResponse {
    private List<String> labels;
    private List<Long> patientRegistrations;
    private List<Long> appointments;
    private List<Long> consultations;
}
