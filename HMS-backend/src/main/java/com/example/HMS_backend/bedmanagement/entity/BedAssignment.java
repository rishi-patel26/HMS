package com.example.HMS_backend.bedmanagement.entity;

import com.example.HMS_backend.bedmanagement.enums.BedAssignmentStatus;
import com.example.HMS_backend.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "bed_assignments")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BedAssignment extends BaseEntity {

    @Column(nullable = false)
    private Long encounterId;

    @Column(nullable = false)
    private Long bedId;

    @Column(nullable = false)
    private Long assignedBy;

    @Column(nullable = false)
    private LocalDateTime assignedAt;

    private LocalDateTime admittedAt;

    private LocalDateTime dischargedAt;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(nullable = false, length = 20)
    private BedAssignmentStatus status = BedAssignmentStatus.ALLOCATED;
}
