package com.example.HMS_backend.encounter.dto;

import com.example.HMS_backend.encounter.enums.Priority;
import com.example.HMS_backend.encounter.enums.VisitType;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EncounterRequest {

    @NotNull(message = "Patient ID is required")
    private Long patientId;

    @NotNull(message = "Doctor ID is required")
    private Long doctorId;

    private Long episodeId;
    private Long appointmentId;

    @NotNull(message = "Visit type is required")
    private VisitType visitType;

    private Priority priority;

    private String notes;
    private String roomNumber;
}
