package com.example.HMS_backend.bedmanagement.entity;

import com.example.HMS_backend.bedmanagement.enums.BedEventType;
import com.example.HMS_backend.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "bed_events")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BedEvent extends BaseEntity {

    @Column(nullable = false)
    private Long encounterId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private BedEventType eventType;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    @Column(nullable = false)
    private Long performedBy;

    @Column(length = 1000)
    private String notes;
}
