package com.example.HMS_backend.bedmanagement.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RejectBedAllocationRequest {

    @NotBlank(message = "Rejection notes are required")
    private String notes;
}
