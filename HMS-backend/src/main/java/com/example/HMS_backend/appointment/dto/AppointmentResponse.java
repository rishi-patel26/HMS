package com.example.HMS_backend.appointment.dto;

import com.example.HMS_backend.appointment.enums.AppointmentStatus;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppointmentResponse {

    private Long id;
    private Long patientId;
    private String patientName;
    private String patientUhid;
    private Long doctorId;
    private String doctorName;
    private LocalDateTime appointmentTime;
    private AppointmentStatus status;
    private String reasonForVisit;
    private String notes;
    private String priority;
    private String department;
    private String createdBy;
    private LocalDateTime createdAt;
}
