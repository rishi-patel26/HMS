package com.example.HMS_backend.bedmanagement.dto;

import com.example.HMS_backend.bedmanagement.enums.BedEventType;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class BedEventResponse {
    private Long id;
    private Long encounterId;
    private BedEventType eventType;
    private LocalDateTime timestamp;
    private Long performedBy;
    private String performedByName;
    private String notes;
}
