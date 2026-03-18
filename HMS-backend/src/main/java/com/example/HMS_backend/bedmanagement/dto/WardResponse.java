package com.example.HMS_backend.bedmanagement.dto;

import com.example.HMS_backend.bedmanagement.enums.WardType;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class WardResponse {
    private Long id;
    private String name;
    private WardType type;
    private Integer capacity;
    private Integer occupiedBeds;
    private Boolean active;
    private double occupancyRate;
}
