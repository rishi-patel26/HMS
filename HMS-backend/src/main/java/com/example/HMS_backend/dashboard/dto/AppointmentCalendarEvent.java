package com.example.HMS_backend.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppointmentCalendarEvent {
    private Long id;
    private String title;
    private LocalDateTime start;
    private LocalDateTime end;
    private String patientName;
    private String doctorName;
    private String status;
    private String backgroundColor;
    private String borderColor;
}
