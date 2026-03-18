package com.example.HMS_backend.bedmanagement.mapper;

import com.example.HMS_backend.bedmanagement.dto.*;
import com.example.HMS_backend.bedmanagement.entity.*;
import com.example.HMS_backend.bedmanagement.enums.BedStatus;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class BedManagementMapper {

    public Ward toWardEntity(WardCreateRequest request) {
        return Ward.builder()
                .name(request.getName())
                .type(request.getType())
                .capacity(request.getCapacity())
                .occupiedBeds(0)
                .active(request.getActive() == null || request.getActive())
                .build();
    }

    public WardResponse toWardResponse(Ward ward) {
        int occupied = ward.getOccupiedBeds() == null ? 0 : ward.getOccupiedBeds();
        int capacity = ward.getCapacity() == null || ward.getCapacity() <= 0 ? 1 : ward.getCapacity();

        return WardResponse.builder()
                .id(ward.getId())
                .name(ward.getName())
                .type(ward.getType())
                .capacity(ward.getCapacity())
                .occupiedBeds(occupied)
                .active(ward.getActive())
                .occupancyRate((occupied * 100.0) / capacity)
                .build();
    }

    public BedResponse toBedResponse(Bed bed) {
        return BedResponse.builder()
                .id(bed.getId())
                .bedNumber(bed.getBedNumber())
                .wardId(bed.getWard().getId())
                .wardName(bed.getWard().getName())
                .bedType(bed.getBedType())
                .status(bed.getStatus())
                .build();
    }

    public Bed toBedEntity(BedCreateRequest request, Ward ward) {
        return Bed.builder()
                .bedNumber(request.getBedNumber())
                .ward(ward)
                .bedType(request.getBedType())
                .status(BedStatus.AVAILABLE)
                .build();
    }

    public BedAllocationRequest toAllocationRequestEntity(CreateBedAllocationRequestRequest request, Long requestedBy) {
        return BedAllocationRequest.builder()
                .encounterId(request.getEncounterId())
                .patientId(request.getPatientId())
                .requestedBy(requestedBy)
                .requiredBedType(request.getRequiredBedType())
                .preferredWardId(request.getPreferredWardId())
                .priority(request.getPriority())
                .notes(request.getNotes())
                .build();
    }

    public BedAllocationRequestResponse toAllocationRequestResponse(
            BedAllocationRequest request,
            String encounterNumber,
            String patientName,
            String patientUhid,
            String requestedByName,
            String preferredWardName
    ) {
        return BedAllocationRequestResponse.builder()
                .id(request.getId())
                .encounterId(request.getEncounterId())
                .encounterNumber(encounterNumber)
                .patientId(request.getPatientId())
                .patientName(patientName)
                .patientUhid(patientUhid)
                .requestedBy(request.getRequestedBy())
                .requestedByName(requestedByName)
                .requiredBedType(request.getRequiredBedType())
                .preferredWardId(request.getPreferredWardId())
                .preferredWardName(preferredWardName)
                .priority(request.getPriority())
                .status(request.getStatus())
                .notes(request.getNotes())
                .createdAt(request.getCreatedAt())
                .updatedAt(request.getUpdatedAt())
                .build();
    }

    public BedAssignmentResponse toAssignmentResponse(
            BedAssignment assignment,
            Bed bed,
            String assignedByName
    ) {
        return BedAssignmentResponse.builder()
                .id(assignment.getId())
                .encounterId(assignment.getEncounterId())
                .bedId(assignment.getBedId())
                .bedNumber(bed.getBedNumber())
                .bedType(bed.getBedType())
                .wardId(bed.getWard().getId())
                .wardName(bed.getWard().getName())
                .assignedBy(assignment.getAssignedBy())
                .assignedByName(assignedByName)
                .assignedAt(assignment.getAssignedAt())
                .admittedAt(assignment.getAdmittedAt())
                .dischargedAt(assignment.getDischargedAt())
                .status(assignment.getStatus())
                .build();
    }

    public BedEvent toEventEntity(Long encounterId, com.example.HMS_backend.bedmanagement.enums.BedEventType eventType,
                                  Long performedBy, String notes) {
        return BedEvent.builder()
                .encounterId(encounterId)
                .eventType(eventType)
                .performedBy(performedBy)
                .timestamp(LocalDateTime.now())
                .notes(notes)
                .build();
    }

    public BedEventResponse toEventResponse(BedEvent event, String performedByName) {
        return BedEventResponse.builder()
                .id(event.getId())
                .encounterId(event.getEncounterId())
                .eventType(event.getEventType())
                .timestamp(event.getTimestamp())
                .performedBy(event.getPerformedBy())
                .performedByName(performedByName)
                .notes(event.getNotes())
                .build();
    }
}
