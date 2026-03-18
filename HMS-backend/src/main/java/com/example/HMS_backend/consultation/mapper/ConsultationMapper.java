package com.example.HMS_backend.consultation.mapper;

import com.example.HMS_backend.consultation.dto.ConsultationRequest;
import com.example.HMS_backend.consultation.dto.ConsultationResponse;
import com.example.HMS_backend.consultation.entity.Consultation;
import com.example.HMS_backend.encounter.entity.Encounter;
import com.example.HMS_backend.encounter.repository.EncounterRepository;
import com.example.HMS_backend.patient.repository.PatientRepository;
import com.example.HMS_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ConsultationMapper {

    private final EncounterRepository encounterRepository;
    private final PatientRepository patientRepository;
    private final UserRepository userRepository;

    public Consultation toEntity(ConsultationRequest request) {
        return Consultation.builder()
                .encounterId(request.getEncounterId())
                .symptoms(request.getSymptoms())
                .diagnosis(request.getDiagnosis())
                .prescription(request.getPrescription())
                .doctorNotes(request.getDoctorNotes())
                .followupDate(request.getFollowupDate())
                .testsRequested(request.getTestsRequested())
                .build();
    }

    public ConsultationResponse toResponse(Consultation consultation) {
        ConsultationResponse.ConsultationResponseBuilder builder = ConsultationResponse.builder()
                .id(consultation.getId())
                .encounterId(consultation.getEncounterId())
                .symptoms(consultation.getSymptoms())
                .diagnosis(consultation.getDiagnosis())
                .prescription(consultation.getPrescription())
                .doctorNotes(consultation.getDoctorNotes())
                .followupDate(consultation.getFollowupDate())
                .testsRequested(consultation.getTestsRequested())
                .createdBy(consultation.getCreatedBy())
                .createdAt(consultation.getCreatedAt())
                .updatedAt(consultation.getUpdatedAt());

        // Resolve patient and doctor names from encounter
        encounterRepository.findById(consultation.getEncounterId()).ifPresent(encounter -> {
            builder.patientId(encounter.getPatientId());
            builder.doctorId(encounter.getDoctorId());

            patientRepository.findById(encounter.getPatientId())
                    .ifPresent(p -> {
                        builder.patientName(p.getFirstName() + " " + p.getLastName());
                        builder.patientUhid(p.getUhid());
                    });

            userRepository.findById(encounter.getDoctorId())
                    .ifPresent(u -> builder.doctorName(u.getUsername()));
        });

        return builder.build();
    }
}
