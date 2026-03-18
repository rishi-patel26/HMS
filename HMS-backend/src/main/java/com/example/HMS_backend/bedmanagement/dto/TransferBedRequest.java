package com.example.HMS_backend.bedmanagement.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TransferBedRequest {

    @NotNull(message = "New bed ID is required")
    private Long newBedId;

    private String notes;
}
