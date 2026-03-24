package com.example.HMS_backend.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DepartmentStats {
    private List<String> departments;
    private List<Long> appointmentCounts;
    private List<Long> consultationCounts;
}
