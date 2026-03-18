package com.example.HMS_backend.bedmanagement.dto;

import com.example.HMS_backend.bedmanagement.enums.BedStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateBedStatusRequest {

    @NotNull(message = "Bed status is required")
    private BedStatus status;
}
