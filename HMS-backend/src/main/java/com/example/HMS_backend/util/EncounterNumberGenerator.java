package com.example.HMS_backend.util;

import com.example.HMS_backend.encounter.repository.EncounterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
@RequiredArgsConstructor
public class EncounterNumberGenerator {

    private final EncounterRepository encounterRepository;

    public String generateEncounterNumber() {
        int year = LocalDate.now().getYear();
        long count = encounterRepository.count() + 1;
        return String.format("ENC-%d-%05d", year, count);
    }
}
