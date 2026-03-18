package com.example.HMS_backend.util;

import com.example.HMS_backend.patient.repository.PatientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class UhidGenerator {

    private final PatientRepository patientRepository;

    public String generateUhid() {
        long count = patientRepository.count() + 1;
        return String.format("HOSP-%06d", count);
    }
}
