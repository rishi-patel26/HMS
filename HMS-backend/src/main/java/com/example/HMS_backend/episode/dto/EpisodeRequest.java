package com.example.HMS_backend.episode.dto;

import com.example.HMS_backend.episode.enums.EpisodeType;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EpisodeRequest {

    @NotNull(message = "Patient ID is required")
    private Long patientId;

    @NotNull(message = "Episode type is required")
    private EpisodeType episodeType;

    private String description;

    private LocalDate startDate;

    private String startTime;
    private LocalDate endDate;
    private String endTime;

    private String severity;
    private String notes;
    private String diagnosisSummary;
}
