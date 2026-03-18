package com.example.HMS_backend.dashboard.controller;

import com.example.HMS_backend.dashboard.dto.DailyTrendResponse;
import com.example.HMS_backend.dashboard.dto.DashboardStats;
import com.example.HMS_backend.dashboard.dto.RevenueTrendResponse;
import com.example.HMS_backend.dashboard.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

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
}
