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
public class EncounterStatusDistribution {
    private List<String> labels;
    private List<Long> data;
    private List<String> colors;
}
