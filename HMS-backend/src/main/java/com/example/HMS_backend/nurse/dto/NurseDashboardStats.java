package com.example.HMS_backend.nurse.dto;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NurseDashboardStats {
    // Today's stats
    private long totalActiveDoctors;
    private long totalActiveEncounters;
    private long waitingPatients;
    private long inConsultationPatients;
    private long completedToday;
    private long todayEncounters;
    private long todayConsultations;

    // Totals
    private long totalEncounters;
    private long totalPatients;
    private long totalConsultations;
    private long totalDoctors;

    // Bed requests
    private long myPendingBedRequests;
    private long myTotalBedRequests;
    private long totalPendingBedRequests;
    private long totalBedRequests;
}
