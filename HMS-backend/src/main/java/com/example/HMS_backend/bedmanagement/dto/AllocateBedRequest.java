package com.example.HMS_backend.bedmanagement.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AllocateBedRequest {

    @NotNull(message = "Bed ID is required")
    private Long bedId;

    private String notes;
}
