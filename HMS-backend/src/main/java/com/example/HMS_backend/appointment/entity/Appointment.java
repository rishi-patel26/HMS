package com.example.HMS_backend.appointment.entity;

import com.example.HMS_backend.appointment.enums.AppointmentStatus;
import com.example.HMS_backend.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "appointments")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Appointment extends BaseEntity {

    @Column(nullable = false)
    private Long patientId;

    @Column(nullable = false)
    private Long doctorId;

    @Column(nullable = false)
    private LocalDateTime appointmentTime;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(nullable = false)
    private AppointmentStatus status = AppointmentStatus.SCHEDULED;

    @Column(length = 20)
    private String reasonForVisit;

    @Column(length = 1000)
    private String notes;

    @Column(length = 100)
    private String priority;

    @Column(length = 100)
    private String department;
}
