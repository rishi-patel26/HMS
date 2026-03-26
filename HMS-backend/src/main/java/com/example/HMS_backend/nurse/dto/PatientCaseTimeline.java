package com.example.HMS_backend.nurse.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PatientCaseTimeline {

    private Long encounterId;
    private String encounterNumber;
    private String encounterStatus;
    private String visitType;
    private String priority;
    private String visitDate;
    private String checkinTime;
    private String encounterNotes;
    private String roomNumber;
    private Long patientId;
    private Long doctorId;

    private String patientName;
    private String patientUhid;
    private String gender;
    private String dob;
    private String phone;
    private String bloodGroup;

    private String doctorName;

    private Long consultationId;
    private String symptoms;
    private String diagnosis;
    private String prescription;
    private String doctorNotes;
    private String followupDate;
    private String testsRequested;
    private String consultationCreatedAt;
}