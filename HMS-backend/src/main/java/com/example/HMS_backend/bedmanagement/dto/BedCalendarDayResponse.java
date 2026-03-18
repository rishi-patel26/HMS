package com.example.HMS_backend.bedmanagement.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;

@Getter
@Builder
public class BedCalendarDayResponse {
    private LocalDate date;
    private int availableBeds;
    private int occupiedBeds;
    private int maintenanceBeds;
}
