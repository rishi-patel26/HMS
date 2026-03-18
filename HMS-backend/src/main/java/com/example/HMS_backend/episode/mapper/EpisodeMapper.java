package com.example.HMS_backend.episode.mapper;

import com.example.HMS_backend.episode.dto.EpisodeRequest;
import com.example.HMS_backend.episode.dto.EpisodeResponse;
import com.example.HMS_backend.episode.entity.Episode;
import com.example.HMS_backend.patient.repository.PatientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
@RequiredArgsConstructor
public class EpisodeMapper {

    private final PatientRepository patientRepository;

    public Episode toEntity(EpisodeRequest request) {
        return Episode.builder()
                .patientId(request.getPatientId())
                .episodeType(request.getEpisodeType())
                .description(request.getDescription())
                .startDate(request.getStartDate() != null ? request.getStartDate() : LocalDate.now())
                .startTime(request.getStartTime())
                .endDate(request.getEndDate())
                .endTime(request.getEndTime())
                .severity(request.getSeverity())
                .notes(request.getNotes())
                .diagnosisSummary(request.getDiagnosisSummary())
                .build();
    }

    public EpisodeResponse toResponse(Episode episode) {
        String patientName = "Unknown Patient";
        String patientUhid = "";
        var patientOpt = patientRepository.findById(episode.getPatientId());
        if (patientOpt.isPresent()) {
            var p = patientOpt.get();
            patientName = p.getFirstName() + " " + p.getLastName();
            patientUhid = p.getUhid();
        }

        return EpisodeResponse.builder()
                .id(episode.getId())
                .patientId(episode.getPatientId())
                .patientName(patientName)
                .patientUhid(patientUhid)
                .episodeType(episode.getEpisodeType())
                .description(episode.getDescription())
                .startDate(episode.getStartDate())
                .startTime(episode.getStartTime())
                .endDate(episode.getEndDate())
                .endTime(episode.getEndTime())
                .status(episode.getStatus())
                .severity(episode.getSeverity())
                .notes(episode.getNotes())
                .diagnosisSummary(episode.getDiagnosisSummary())
                .createdBy(episode.getCreatedBy())
                .createdAt(episode.getCreatedAt())
                .build();
    }
}
