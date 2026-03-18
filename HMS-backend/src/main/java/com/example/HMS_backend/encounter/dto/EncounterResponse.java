package com.example.HMS_backend.encounter.dto;

import com.example.HMS_backend.encounter.enums.EncounterStatus;
import com.example.HMS_backend.encounter.enums.Priority;
import com.example.HMS_backend.encounter.enums.VisitType;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EncounterResponse {

    private Long id;
    private String encounterNumber;
    private Long patientId;
    private String patientName;
    private String patientUhid;
    private Long doctorId;
    private String doctorName;
    private Long episodeId;
    private Long appointmentId;
    private VisitType visitType;
    private EncounterStatus status;
    private LocalDateTime visitDate;
    private LocalDateTime checkinTime;
    private Priority priority;
    private String notes;
    private String roomNumber;
    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
