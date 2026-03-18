package com.example.HMS_backend.bedmanagement.dto;

import com.example.HMS_backend.bedmanagement.enums.BedAssignmentStatus;
import com.example.HMS_backend.bedmanagement.enums.BedType;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class BedAssignmentResponse {
    private Long id;
    private Long encounterId;
    private Long bedId;
    private String bedNumber;
    private BedType bedType;
    private Long wardId;
    private String wardName;
    private Long assignedBy;
    private String assignedByName;
    private LocalDateTime assignedAt;
    private LocalDateTime admittedAt;
    private LocalDateTime dischargedAt;
    private BedAssignmentStatus status;
}
