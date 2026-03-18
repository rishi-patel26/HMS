package com.example.HMS_backend.consultation.entity;

import com.example.HMS_backend.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "consultations")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Consultation extends BaseEntity {

    @Column(nullable = false)
    private Long encounterId;

    @Column(length = 1000)
    private String symptoms;

    @Column(nullable = false, length = 2000)
    private String diagnosis;

    @Column(nullable = false, length = 2000)
    private String prescription;

    @Column(length = 2000)
    private String doctorNotes;

    private LocalDate followupDate;

    @Column(length = 1000)
    private String testsRequested;
}
