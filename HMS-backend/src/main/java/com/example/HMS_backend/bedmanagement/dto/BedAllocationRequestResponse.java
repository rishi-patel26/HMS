package com.example.HMS_backend.bedmanagement.dto;

import com.example.HMS_backend.bedmanagement.enums.BedAllocationPriority;
import com.example.HMS_backend.bedmanagement.enums.BedAllocationRequestStatus;
import com.example.HMS_backend.bedmanagement.enums.BedType;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class BedAllocationRequestResponse {
    private Long id;
    private Long encounterId;
    private String encounterNumber;
    private Long patientId;
    private String patientName;
    private String patientUhid;
    private Long requestedBy;
    private String requestedByName;
    private BedType requiredBedType;
    private Long preferredWardId;
    private String preferredWardName;
    private BedAllocationPriority priority;
    private BedAllocationRequestStatus status;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
