package com.example.HMS_backend.nurse.dto;

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
public class DoctorPatientItem {
    private Long encounterId;
    private String encounterNumber;
    private Long patientId;
    private String patientName;
    private String patientUhid;
    private String gender;
    private String phone;
    private EncounterStatus encounterStatus;
    private VisitType visitType;
    private Priority priority;
    private LocalDateTime visitDate;
    private LocalDateTime checkinTime;
    private String notes;
    private String roomNumber;
}
