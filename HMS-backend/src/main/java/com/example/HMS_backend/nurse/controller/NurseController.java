package com.example.HMS_backend.nurse.controller;

import com.example.HMS_backend.nurse.dto.*;
import com.example.HMS_backend.nurse.service.NurseService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/nurse")
@RequiredArgsConstructor
public class NurseController {

    private final NurseService nurseService;

    @GetMapping("/doctors")
    @PreAuthorize("hasAnyRole('NURSE', 'ADMIN')")
    public ResponseEntity<List<DoctorOption>> getDoctors() {
        return ResponseEntity.ok(nurseService.getDoctors());
    }

    @GetMapping("/doctor/{doctorId}/patients")
    @PreAuthorize("hasAnyRole('NURSE', 'ADMIN')")
    public ResponseEntity<List<DoctorPatientItem>> getDoctorPatients(
            @PathVariable Long doctorId) {
        return ResponseEntity.ok(nurseService.getActiveEncountersForDoctor(doctorId));
    }

    @GetMapping("/case/{encounterId}")
    @PreAuthorize("hasAnyRole('NURSE', 'ADMIN')")
    public ResponseEntity<PatientCaseTimeline> getPatientCase(
            @PathVariable Long encounterId) {
        return ResponseEntity.ok(nurseService.getPatientCase(encounterId));
    }

    @GetMapping("/dashboard-stats")
    @PreAuthorize("hasAnyRole('NURSE', 'ADMIN')")
    public ResponseEntity<NurseDashboardStats> getDashboardStats() {
        return ResponseEntity.ok(nurseService.getDashboardStats());
    }
}
