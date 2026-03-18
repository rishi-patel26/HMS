package com.example.HMS_backend.dashboard.dto;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStats {

    // Admin stats
    private long totalPatients;
    private long totalAppointmentsToday;
    private long totalEncountersToday;
    private BigDecimal totalRevenueToday;
    private long activeEpisodes;
    private long totalUsers;

    // Frontdesk stats
    private long todayAppointments;
    private long waitingPatients;
    private long checkedInPatients;
    private long pendingBills;
    private BigDecimal todayRevenue;

    // Enhanced Admin stats
    private long totalAppointments;
    private long totalConsultations;
    private long totalBills;
    private long totalEncounters;
    private long totalEpisodes;
    private BigDecimal totalRevenue;
    private long todayConsultations;

    // Enhanced Frontdesk stats
    private long totalAppointmentsAll;
    private long totalEncountersAll;
    private long totalEpisodesAll;
    private long totalPatientsAll;
    private long todayBills;
    private BigDecimal totalRevenueAll;

    // Doctor stats
    private long encounterQueue;
    private long patientsWaiting;
    private long doctorActiveEpisodes;
    private long followUpPatients;

    // Enhanced Doctor stats
    private long doctorTodayAppointments;
    private long doctorCompletedConsultations;
    private long doctorTodayPatients;
    private long doctorTotalAppointments;
    private long doctorTotalConsultations;
    private long doctorTotalEncounters;
    private long doctorTodayConsultations;
    private long doctorCompletedToday;
}
