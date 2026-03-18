package com.example.HMS_backend.consultation.controller;

import com.example.HMS_backend.consultation.dto.ConsultationRequest;
import com.example.HMS_backend.consultation.dto.ConsultationResponse;
import com.example.HMS_backend.consultation.service.ConsultationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/consultations")
@RequiredArgsConstructor
public class ConsultationController {

    private final ConsultationService consultationService;

    @PostMapping
    @PreAuthorize("hasAnyRole('DOCTOR','ADMIN')")
    public ResponseEntity<ConsultationResponse> createConsultation(
            @Valid @RequestBody ConsultationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(consultationService.createConsultation(request));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN', 'FRONTDESK', 'NURSE')")
    public ResponseEntity<ConsultationResponse> getConsultationById(@PathVariable Long id) {
        return ResponseEntity.ok(consultationService.getConsultationById(id));
    }

    @GetMapping("/encounter/{encounterId}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN', 'FRONTDESK', 'NURSE')")
    public ResponseEntity<ConsultationResponse> getConsultationByEncounter(
            @PathVariable Long encounterId) {
        return ResponseEntity.ok(consultationService.getConsultationByEncounter(encounterId));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('DOCTOR','ADMIN')")
    public ResponseEntity<ConsultationResponse> updateConsultation(
            @PathVariable Long id, @Valid @RequestBody ConsultationRequest request) {
        return ResponseEntity.ok(consultationService.updateConsultation(id, request));
    }

    @PutMapping("/{id}/complete")
    @PreAuthorize("hasAnyRole('DOCTOR','ADMIN')")
    public ResponseEntity<ConsultationResponse> completeConsultation(@PathVariable Long id) {
        return ResponseEntity.ok(consultationService.completeConsultation(id));
    }

    @GetMapping("/doctor/{doctorUsername}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    public ResponseEntity<List<ConsultationResponse>> getConsultationsByDoctor(
            @PathVariable String doctorUsername) {
        return ResponseEntity.ok(consultationService.getConsultationsByDoctor(doctorUsername));
    }

    @GetMapping("/today")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    public ResponseEntity<List<ConsultationResponse>> getTodayConsultations() {
        return ResponseEntity.ok(consultationService.getTodayConsultations());
    }

    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    public ResponseEntity<List<ConsultationResponse>> searchConsultations(
            @RequestParam(required = false) String patientName,
            @RequestParam(required = false) Long patientId) {
        return ResponseEntity.ok(consultationService.searchConsultations(patientName, patientId));
    }
}
