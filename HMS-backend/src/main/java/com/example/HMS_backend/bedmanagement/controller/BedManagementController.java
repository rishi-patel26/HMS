package com.example.HMS_backend.bedmanagement.controller;

import com.example.HMS_backend.bedmanagement.dto.*;
import com.example.HMS_backend.bedmanagement.enums.BedAllocationRequestStatus;
import com.example.HMS_backend.bedmanagement.enums.BedStatus;
import com.example.HMS_backend.bedmanagement.enums.BedType;
import com.example.HMS_backend.bedmanagement.service.BedManagementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bed-management")
@RequiredArgsConstructor
public class BedManagementController {

    private final BedManagementService bedManagementService;

    @PostMapping("/wards")
    @PreAuthorize("hasAnyRole('ADMIN', 'BED_MANAGER')")
    public ResponseEntity<WardResponse> createWard(@Valid @RequestBody WardCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(bedManagementService.createWard(request));
    }

    @GetMapping("/wards")
    @PreAuthorize("hasAnyRole('ADMIN', 'BED_MANAGER', 'NURSE')")
    public ResponseEntity<List<WardResponse>> getWardOccupancy() {
        return ResponseEntity.ok(bedManagementService.getWardOccupancy());
    }

    @PostMapping("/beds")
    @PreAuthorize("hasAnyRole('ADMIN', 'BED_MANAGER')")
    public ResponseEntity<BedResponse> createBed(@Valid @RequestBody BedCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(bedManagementService.createBed(request));
    }

    @GetMapping("/wards/{wardId}/beds")
    @PreAuthorize("hasAnyRole('ADMIN', 'BED_MANAGER')")
    public ResponseEntity<List<BedResponse>> getBedsByWard(@PathVariable Long wardId) {
        return ResponseEntity.ok(bedManagementService.getBedsByWard(wardId));
    }

    @PutMapping("/beds/{bedId}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'BED_MANAGER')")
    public ResponseEntity<BedResponse> updateBedStatus(
            @PathVariable Long bedId,
            @Valid @RequestBody UpdateBedStatusRequest request
    ) {
        return ResponseEntity.ok(bedManagementService.updateBedStatus(bedId, request));
    }

    @PostMapping("/requests")
    @PreAuthorize("hasAnyRole('NURSE', 'ADMIN')")
    public ResponseEntity<BedAllocationRequestResponse> createAllocationRequest(
            @Valid @RequestBody CreateBedAllocationRequestRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(bedManagementService.createAllocationRequest(request));
    }

    @GetMapping("/requests/{requestId}")
    @PreAuthorize("hasAnyRole('NURSE', 'ADMIN', 'BED_MANAGER')")
    public ResponseEntity<BedAllocationRequestResponse> getAllocationRequestById(@PathVariable Long requestId) {
        return ResponseEntity.ok(bedManagementService.getAllocationRequestById(requestId));
    }

    @GetMapping("/requests/encounter/{encounterId}")
    @PreAuthorize("hasAnyRole('NURSE', 'ADMIN', 'BED_MANAGER')")
    public ResponseEntity<List<BedAllocationRequestResponse>> getAllocationRequestsByEncounter(
            @PathVariable Long encounterId
    ) {
        return ResponseEntity.ok(bedManagementService.getAllocationRequestsByEncounter(encounterId));
    }

    @GetMapping("/requests/my")
    @PreAuthorize("hasAnyRole('NURSE', 'ADMIN')")
    public ResponseEntity<List<BedAllocationRequestResponse>> getMyAllocationRequests() {
        return ResponseEntity.ok(bedManagementService.getMyAllocationRequests());
    }

    @GetMapping("/requests/{requestId}/timeline")
    @PreAuthorize("hasAnyRole('NURSE', 'ADMIN', 'BED_MANAGER')")
    public ResponseEntity<List<BedEventResponse>> getTimelineByRequestId(@PathVariable Long requestId) {
        return ResponseEntity.ok(bedManagementService.getTimelineByRequestId(requestId));
    }

    @GetMapping("/queue")
    @PreAuthorize("hasAnyRole('ADMIN', 'BED_MANAGER')")
    public ResponseEntity<List<BedAllocationRequestResponse>> getPriorityQueue() {
        return ResponseEntity.ok(bedManagementService.getPriorityQueue());
    }

    @PutMapping("/requests/{requestId}/review")
    @PreAuthorize("hasAnyRole('ADMIN', 'BED_MANAGER')")
    public ResponseEntity<BedAllocationRequestResponse> markUnderReview(
            @PathVariable Long requestId,
            @RequestBody(required = false) MarkUnderReviewRequest request
    ) {
        MarkUnderReviewRequest payload = request == null ? new MarkUnderReviewRequest() : request;
        return ResponseEntity.ok(bedManagementService.markRequestUnderReview(requestId, payload));
    }

    @PutMapping("/requests/{requestId}/reject")
    @PreAuthorize("hasAnyRole('ADMIN', 'BED_MANAGER')")
    public ResponseEntity<BedAllocationRequestResponse> rejectRequest(
            @PathVariable Long requestId,
            @Valid @RequestBody RejectBedAllocationRequest request
    ) {
        return ResponseEntity.ok(bedManagementService.rejectRequest(requestId, request));
    }

    @PutMapping("/requests/{requestId}/allocate")
    @PreAuthorize("hasAnyRole('ADMIN', 'BED_MANAGER')")
    public ResponseEntity<BedAssignmentResponse> allocateBed(
            @PathVariable Long requestId,
            @Valid @RequestBody AllocateBedRequest request
    ) {
        return ResponseEntity.ok(bedManagementService.allocateBed(requestId, request));
    }

    @PutMapping("/assignments/{assignmentId}/admit")
    @PreAuthorize("hasAnyRole('ADMIN', 'BED_MANAGER')")
    public ResponseEntity<BedAssignmentResponse> admitPatient(@PathVariable Long assignmentId) {
        return ResponseEntity.ok(bedManagementService.admitPatient(assignmentId));
    }

    @PutMapping("/assignments/{assignmentId}/discharge")
    @PreAuthorize("hasAnyRole('ADMIN', 'BED_MANAGER')")
    public ResponseEntity<BedAssignmentResponse> dischargePatient(@PathVariable Long assignmentId) {
        return ResponseEntity.ok(bedManagementService.dischargePatient(assignmentId));
    }

    @PutMapping("/assignments/{assignmentId}/transfer")
    @PreAuthorize("hasAnyRole('ADMIN', 'BED_MANAGER')")
    public ResponseEntity<BedAssignmentResponse> transferBed(
            @PathVariable Long assignmentId,
            @Valid @RequestBody TransferBedRequest request
    ) {
        return ResponseEntity.ok(bedManagementService.transferBed(assignmentId, request));
    }

    @PutMapping("/assignments/{assignmentId}/complete")
    @PreAuthorize("hasAnyRole('ADMIN', 'BED_MANAGER')")
    public ResponseEntity<BedAssignmentResponse> completeAssignment(@PathVariable Long assignmentId) {
        return ResponseEntity.ok(bedManagementService.completeAssignment(assignmentId));
    }

    @GetMapping("/beds/available")
    @PreAuthorize("hasAnyRole('ADMIN', 'BED_MANAGER')")
    public ResponseEntity<List<BedResponse>> getAvailableBeds(
            @RequestParam(required = false) BedType bedType,
            @RequestParam(required = false) Long wardId
    ) {
        return ResponseEntity.ok(bedManagementService.getAvailableBeds(bedType, wardId));
    }

    @GetMapping("/beds/assignable")
    @PreAuthorize("hasAnyRole('ADMIN', 'BED_MANAGER')")
    public ResponseEntity<List<BedResponse>> getAssignableBeds(
            @RequestParam BedType bedType,
            @RequestParam(required = false) Long preferredWardId,
            @RequestParam(required = false) Long excludeBedId
    ) {
        return ResponseEntity.ok(bedManagementService.getAssignableBeds(bedType, preferredWardId, excludeBedId));
    }

    @GetMapping("/beds")
    @PreAuthorize("hasAnyRole('ADMIN', 'BED_MANAGER')")
    public ResponseEntity<List<BedResponse>> getBeds(@RequestParam(required = false) BedStatus status) {
        return ResponseEntity.ok(bedManagementService.getBeds(status));
    }

    @GetMapping("/requests")
    @PreAuthorize("hasAnyRole('ADMIN', 'BED_MANAGER', 'NURSE')")
    public ResponseEntity<List<BedAllocationRequestResponse>> getRequests(
            @RequestParam(required = false) BedAllocationRequestStatus status
    ) {
        return ResponseEntity.ok(bedManagementService.getRequests(status));
    }

    @GetMapping("/assignments")
    @PreAuthorize("hasAnyRole('ADMIN', 'BED_MANAGER', 'NURSE')")
    public ResponseEntity<List<BedAssignmentResponse>> getAssignments(
            @RequestParam(required = false) String status
    ) {
        return ResponseEntity.ok(bedManagementService.getAssignments(status));
    }

    @GetMapping("/calendar")
    @PreAuthorize("hasAnyRole('ADMIN', 'BED_MANAGER')")
    public ResponseEntity<List<BedCalendarDayResponse>> getMonthlyCalendar(
            @RequestParam int year,
            @RequestParam int month
    ) {
        return ResponseEntity.ok(bedManagementService.getMonthlyBedCalendar(year, month));
    }

    @GetMapping("/assignments/active")
    @PreAuthorize("hasAnyRole('ADMIN', 'BED_MANAGER')")
    public ResponseEntity<List<BedAssignmentResponse>> getActiveAssignments() {
        return ResponseEntity.ok(bedManagementService.getActiveAssignments());
    }

    @GetMapping("/dashboard")
    @PreAuthorize("hasAnyRole('ADMIN', 'BED_MANAGER')")
    public ResponseEntity<BedManagerDashboardResponse> getDashboard() {
        return ResponseEntity.ok(bedManagementService.getBedManagerDashboard());
    }
}
