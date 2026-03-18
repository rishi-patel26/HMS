package com.example.HMS_backend.consultation.dto;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConsultationResponse {

    private Long id;
    private Long encounterId;
    private String symptoms;
    private String diagnosis;
    private String prescription;
    private String doctorNotes;
    private LocalDate followupDate;
    private String testsRequested;
    private String patientName;
    private String patientUhid;
    private String doctorName;
    private Long patientId;
    private Long doctorId;
    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
