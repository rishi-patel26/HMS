package com.example.HMS_backend.nurse.dto;

import com.example.HMS_backend.encounter.enums.EncounterStatus;
import com.example.HMS_backend.encounter.enums.Priority;
import com.example.HMS_backend.encounter.enums.VisitType;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PatientCaseTimeline {

    // Encounter info
    private Long encounterId;
    private String encounterNumber;
    private EncounterStatus encounterStatus;
    private VisitType visitType;
    private Priority priority;
    private LocalDateTime visitDate;
    private LocalDateTime checkinTime;
    private String encounterNotes;
    private String roomNumber;

    // Patient info
    private Long patientId;
    private String patientName;
    private String patientUhid;
    private String gender;
    private String dob;
    private String phone;
    private String bloodGroup;
    private String allergies;

    // Doctor info
    private Long doctorId;
    private String doctorName;

    // Consultation info (may be null if no consultation yet)
    private Long consultationId;
    private String symptoms;
    private String diagnosis;
    private String prescription;
    private String doctorNotes;
    private LocalDate followupDate;
    private String testsRequested;
    private LocalDateTime consultationCreatedAt;
}
