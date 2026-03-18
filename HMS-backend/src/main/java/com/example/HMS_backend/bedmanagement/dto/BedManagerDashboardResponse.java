package com.example.HMS_backend.bedmanagement.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class BedManagerDashboardResponse {
    private List<BedAllocationRequestResponse> priorityQueue;
    private List<WardResponse> wardOccupancy;
    private List<BedResponse> availableBeds;
    private List<BedAssignmentResponse> activeAssignments;
}
