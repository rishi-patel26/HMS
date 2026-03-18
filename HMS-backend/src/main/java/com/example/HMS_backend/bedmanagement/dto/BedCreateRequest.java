package com.example.HMS_backend.bedmanagement.dto;

import com.example.HMS_backend.bedmanagement.enums.BedType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class BedCreateRequest {

    @NotBlank(message = "Bed number is required")
    private String bedNumber;

    @NotNull(message = "Ward ID is required")
    private Long wardId;

    @NotNull(message = "Bed type is required")
    private BedType bedType;
}
