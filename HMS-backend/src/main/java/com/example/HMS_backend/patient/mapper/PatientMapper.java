package com.example.HMS_backend.patient.mapper;

import com.example.HMS_backend.patient.dto.PatientRequest;
import com.example.HMS_backend.patient.dto.PatientResponse;
import com.example.HMS_backend.patient.entity.Patient;
import org.springframework.stereotype.Component;

@Component
public class PatientMapper {

    public Patient toEntity(PatientRequest request) {
        return Patient.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .gender(request.getGender())
                .dob(request.getDob())
                .phone(request.getPhone())
                .email(request.getEmail())
                .address(request.getAddress())
                .bloodGroup(request.getBloodGroup())
                .emergencyContact(request.getEmergencyContact())
                .build();
    }

    //  Added method to avoid duplication in service
    public void updateEntity(Patient patient, PatientRequest request) {
        patient.setFirstName(request.getFirstName());
        patient.setLastName(request.getLastName());
        patient.setGender(request.getGender());
        patient.setDob(request.getDob());
        patient.setPhone(request.getPhone());
        patient.setEmail(request.getEmail());
        patient.setAddress(request.getAddress());
        patient.setBloodGroup(request.getBloodGroup());
        patient.setEmergencyContact(request.getEmergencyContact());
    }

    public PatientResponse toResponse(Patient patient) {
        return PatientResponse.builder()
                .id(patient.getId())
                .uhid(patient.getUhid())
                .firstName(patient.getFirstName())
                .lastName(patient.getLastName())
                .gender(patient.getGender())
                .dob(patient.getDob())
                .phone(patient.getPhone())
                .email(patient.getEmail())
                .address(patient.getAddress())
                .bloodGroup(patient.getBloodGroup())
                .emergencyContact(patient.getEmergencyContact())
                .createdAt(patient.getCreatedAt())
                .updatedAt(patient.getUpdatedAt())
                .build();
    }
}