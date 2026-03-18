package com.example.HMS_backend.encounter.entity;

import com.example.HMS_backend.encounter.enums.EncounterStatus;
import com.example.HMS_backend.encounter.enums.Priority;
import com.example.HMS_backend.encounter.enums.VisitType;
import com.example.HMS_backend.entity.BaseEntity;
import com.example.HMS_backend.episode.entity.Episode;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "encounters")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Encounter extends BaseEntity {

    @Column(nullable = false, unique = true)
    private String encounterNumber;

    @Column(nullable = false)
    private Long patientId;

    @Column(nullable = false)
    private Long doctorId;

    @Column(name = "episode_id")
    private Long episodeId;

    private Long appointmentId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private VisitType visitType;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(nullable = false)
    private EncounterStatus status = EncounterStatus.WAITING;

    @Column(name = "visit_date")
    private LocalDateTime visitDate;

    @Column(name = "checkin_time")
    private LocalDateTime checkinTime;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(nullable = false)
    private Priority priority = Priority.NORMAL;

    @Column(length = 1000)
    private String notes;

    @Column(name = "room_number", length = 20)
    private String roomNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "episode_id", insertable = false, updatable = false)
    private Episode episode;
}
