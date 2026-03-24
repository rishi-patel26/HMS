package com.example.HMS_backend.dashboard.controller;

import com.example.HMS_backend.dashboard.dto.*;
import com.example.HMS_backend.dashboard.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DashboardStats> getAdminStats() {
        return ResponseEntity.ok(dashboardService.getAdminStats());
    }

    @GetMapping("/frontdesk")
    @PreAuthorize("hasAnyRole('ADMIN', 'FRONTDESK')")
    public ResponseEntity<DashboardStats> getFrontdeskStats() {
        return ResponseEntity.ok(dashboardService.getFrontdeskStats());
    }

    @GetMapping("/doctor")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR')")
    public ResponseEntity<DashboardStats> getDoctorStats(Authentication authentication) {
        return ResponseEntity.ok(dashboardService.getDoctorStats(authentication.getName()));
    }

    @GetMapping("/admin/daily-trends")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DailyTrendResponse> getDailyTrends(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(dashboardService.getDailyTrends(from, to));
    }

    @GetMapping("/admin/revenue-trends")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<RevenueTrendResponse> getRevenueTrends(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(dashboardService.getRevenueTrends(from, to));
    }
    
    @GetMapping("/encounter-status-distribution")
    @PreAuthorize("hasAnyRole('ADMIN', 'FRONTDESK', 'DOCTOR', 'NURSE')")
    public ResponseEntity<EncounterStatusDistribution> getEncounterStatusDistribution() {
        return ResponseEntity.ok(dashboardService.getEncounterStatusDistribution());
    }
    
    @GetMapping("/appointment-calendar")
    @PreAuthorize("hasAnyRole('ADMIN', 'FRONTDESK', 'DOCTOR')")
    public ResponseEntity<List<AppointmentCalendarEvent>> getAppointmentCalendarEvents(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(dashboardService.getAppointmentCalendarEvents(from, to));
    }
    
    @GetMapping("/department-stats")
    @PreAuthorize("hasAnyRole('ADMIN', 'FRONTDESK')")
    public ResponseEntity<DepartmentStats> getDepartmentStats() {
        return ResponseEntity.ok(dashboardService.getDepartmentStats());
    }
}
