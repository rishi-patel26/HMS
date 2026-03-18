package com.example.HMS_backend.episode.entity;

import com.example.HMS_backend.encounter.entity.Encounter;
import com.example.HMS_backend.entity.BaseEntity;
import com.example.HMS_backend.episode.enums.EpisodeType;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "episodes")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Episode extends BaseEntity {

    @Column(nullable = false)
    private Long patientId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, name = "episode_type")
    private EpisodeType episodeType;

    private String description;

    @Column(nullable = false)
    private LocalDate startDate;

    private LocalDate endDate;

    @Column(name = "start_time")
    private String startTime;

    @Column(name = "end_time")
    private String endTime;

    @Builder.Default
    @Column(nullable = false)
    private String status = "ACTIVE";

    @Column(length = 50)
    private String severity;

    @Column(length = 1000)
    private String notes;

    @Column(name = "diagnosis_summary", length = 2000)
    private String diagnosisSummary;

    @Builder.Default
    @OneToMany(mappedBy = "episode", fetch = FetchType.LAZY)
    private List<Encounter> encounters = new ArrayList<>();
}
