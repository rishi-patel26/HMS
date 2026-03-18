package com.example.HMS_backend.patient.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PatientRequest {

    @NotBlank(message = "First name is required")
    private String firstName;

    @NotBlank(message = "Last name is required")
    private String lastName;

    @NotBlank(message = "Gender is required")
    private String gender;

    private LocalDate dob;

    @NotBlank(message = "Phone is required")
    private String phone;

    private String email;
    private String address;
    private String bloodGroup;
    private String emergencyContact;
    private String allergies;
    private String insuranceProvider;
}
