package com.example.HMS_backend.encounter.controller;

import com.example.HMS_backend.encounter.dto.EncounterRequest;
import com.example.HMS_backend.encounter.dto.EncounterResponse;
import com.example.HMS_backend.encounter.enums.EncounterStatus;
import com.example.HMS_backend.encounter.service.EncounterService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/encounters")
@RequiredArgsConstructor
public class EncounterController {

    private final EncounterService encounterService;

    @PostMapping("/checkin")
    public ResponseEntity<EncounterResponse> checkInPatient(@Valid @RequestBody EncounterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(encounterService.checkInPatient(request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<EncounterResponse> getEncounterById(@PathVariable Long id) {
        return ResponseEntity.ok(encounterService.getEncounterById(id));
    }

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<EncounterResponse>> getEncountersByPatient(@PathVariable Long patientId) {
        return ResponseEntity.ok(encounterService.getEncountersByPatient(patientId));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<EncounterResponse> updateEncounterStatus(@PathVariable Long id,
                                                                    @RequestParam EncounterStatus status) {
        return ResponseEntity.ok(encounterService.updateEncounterStatus(id, status));
    }

    @PutMapping("/{id}/link-episode/{episodeId}")
    public ResponseEntity<EncounterResponse> linkEpisode(@PathVariable Long id,
                                                          @PathVariable Long episodeId) {
        return ResponseEntity.ok(encounterService.linkEpisode(id, episodeId));
    }

    @GetMapping("/today")
    public ResponseEntity<List<EncounterResponse>> getTodayEncounters() {
        return ResponseEntity.ok(encounterService.getTodayEncounters());
    }

    @GetMapping("/by-date")
    public ResponseEntity<List<EncounterResponse>> getEncountersByDate(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(encounterService.getEncountersByDate(date));
    }

    @GetMapping("/doctor/today")
    public ResponseEntity<List<EncounterResponse>> getDoctorTodayEncounters(Authentication authentication) {
        return ResponseEntity.ok(encounterService.getDoctorTodayEncounters(authentication.getName()));
    }

    @GetMapping("/doctor/all")
    public ResponseEntity<List<EncounterResponse>> getDoctorAllEncounters(Authentication authentication) {
        return ResponseEntity.ok(encounterService.getDoctorAllEncounters(authentication.getName()));
    }

    @GetMapping("/doctor/by-date")
    public ResponseEntity<List<EncounterResponse>> getDoctorEncountersByDate(
            Authentication authentication,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(encounterService.getDoctorEncountersByDate(authentication.getName(), date));
    }

    @GetMapping("/episode/{episodeId}")
    public ResponseEntity<List<EncounterResponse>> getEncountersByEpisode(@PathVariable Long episodeId) {
        return ResponseEntity.ok(encounterService.getEncountersByEpisode(episodeId));
    }
}
