package com.example.HMS_backend.bedmanagement.dto;

import com.example.HMS_backend.bedmanagement.enums.BedAllocationPriority;
import com.example.HMS_backend.bedmanagement.enums.BedType;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateBedAllocationRequestRequest {

    @NotNull(message = "Encounter ID is required")
    private Long encounterId;

    @NotNull(message = "Patient ID is required")
    private Long patientId;

    @NotNull(message = "Required bed type is required")
    private BedType requiredBedType;

    private Long preferredWardId;

    @NotNull(message = "Priority is required")
    private BedAllocationPriority priority;

    private String notes;
}
