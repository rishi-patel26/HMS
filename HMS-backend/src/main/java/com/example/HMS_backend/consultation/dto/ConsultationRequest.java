package com.example.HMS_backend.consultation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConsultationRequest {

    @NotNull(message = "Encounter ID is required")
    private Long encounterId;

    private String symptoms;

    @NotBlank(message = "Diagnosis is required")
    private String diagnosis;

    @NotBlank(message = "Prescription is required")
    private String prescription;

    private String doctorNotes;

    private LocalDate followupDate;

    private String testsRequested;
}
