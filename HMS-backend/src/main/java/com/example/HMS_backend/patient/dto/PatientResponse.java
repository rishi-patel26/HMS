package com.example.HMS_backend.patient.dto;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PatientResponse {

    private Long id;
    private String uhid;
    private String firstName;
    private String lastName;
    private String gender;
    private LocalDate dob;
    private String phone;
    private String email;
    private String address;
    private String bloodGroup;
    private String emergencyContact;
    private String allergies;
    private String insuranceProvider;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
