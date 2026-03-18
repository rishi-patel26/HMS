package com.example.HMS_backend.encounter.mapper;

import com.example.HMS_backend.encounter.dto.EncounterRequest;
import com.example.HMS_backend.encounter.dto.EncounterResponse;
import com.example.HMS_backend.encounter.entity.Encounter;
import com.example.HMS_backend.encounter.enums.Priority;
import com.example.HMS_backend.patient.repository.PatientRepository;
import com.example.HMS_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class EncounterMapper {

    private final PatientRepository patientRepository;
    private final UserRepository userRepository;

    public Encounter toEntity(EncounterRequest request) {
        return Encounter.builder()
                .patientId(request.getPatientId())
                .doctorId(request.getDoctorId())
                .appointmentId(request.getAppointmentId())
                .episodeId(request.getEpisodeId())
                .visitType(request.getVisitType())
                .priority(request.getPriority() != null ? request.getPriority() : Priority.NORMAL)
                .notes(request.getNotes())
                .roomNumber(request.getRoomNumber())
                .build();
    }

    public EncounterResponse toResponse(Encounter encounter) {
        String patientName = "Unknown Patient";
        String patientUhid = "";
        var patientOpt = patientRepository.findById(encounter.getPatientId());
        if (patientOpt.isPresent()) {
            var p = patientOpt.get();
            patientName = p.getFirstName() + " " + p.getLastName();
            patientUhid = p.getUhid();
        }
        String doctorName = userRepository.findById(encounter.getDoctorId())
                .map(u -> u.getUsername())
                .orElse("Unknown Doctor");

        return EncounterResponse.builder()
                .id(encounter.getId())
                .encounterNumber(encounter.getEncounterNumber())
                .patientId(encounter.getPatientId())
                .patientName(patientName)
                .patientUhid(patientUhid)
                .doctorId(encounter.getDoctorId())
                .doctorName(doctorName)
                .episodeId(encounter.getEpisodeId())
                .appointmentId(encounter.getAppointmentId())
                .visitType(encounter.getVisitType())
                .status(encounter.getStatus())
                .visitDate(encounter.getVisitDate())
                .checkinTime(encounter.getCheckinTime())
                .priority(encounter.getPriority())
                .notes(encounter.getNotes())
                .roomNumber(encounter.getRoomNumber())
                .createdBy(encounter.getCreatedBy())
                .createdAt(encounter.getCreatedAt())
                .updatedAt(encounter.getUpdatedAt())
                .build();
    }
}
