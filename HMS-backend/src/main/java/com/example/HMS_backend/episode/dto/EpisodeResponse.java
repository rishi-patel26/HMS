package com.example.HMS_backend.episode.dto;

import com.example.HMS_backend.episode.enums.EpisodeType;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EpisodeResponse {

    private Long id;
    private Long patientId;
    private String patientName;
    private String patientUhid;
    private EpisodeType episodeType;
    private String description;
    private LocalDate startDate;
    private LocalDate endDate;
    private String startTime;
    private String endTime;
    private String status;
    private String severity;
    private String notes;
    private String diagnosisSummary;
    private String createdBy;
    private LocalDateTime createdAt;
}
