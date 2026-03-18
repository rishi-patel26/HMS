package com.example.HMS_backend.bedmanagement.controller;

import com.example.HMS_backend.bedmanagement.dto.BedAllocationRequestResponse;
import com.example.HMS_backend.bedmanagement.dto.BedAssignmentResponse;
import com.example.HMS_backend.bedmanagement.dto.BedResponse;
import com.example.HMS_backend.bedmanagement.dto.WardResponse;
import com.example.HMS_backend.bedmanagement.enums.BedAllocationRequestStatus;
import com.example.HMS_backend.bedmanagement.enums.BedStatus;
import com.example.HMS_backend.bedmanagement.service.BedManagementService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class BedWorkflowQueryController {

    private final BedManagementService bedManagementService;

    @GetMapping("/beds")
    @PreAuthorize("hasAnyRole('ADMIN', 'BED_MANAGER', 'NURSE')")
    public ResponseEntity<List<BedResponse>> getBeds(@RequestParam(required = false) BedStatus status) {
        return ResponseEntity.ok(bedManagementService.getBeds(status));
    }

    @GetMapping("/wards")
    @PreAuthorize("hasAnyRole('ADMIN', 'BED_MANAGER', 'NURSE')")
    public ResponseEntity<List<WardResponse>> getWards() {
        return ResponseEntity.ok(bedManagementService.getWardOccupancy());
    }

    @GetMapping("/bed-requests")
    @PreAuthorize("hasAnyRole('ADMIN', 'BED_MANAGER', 'NURSE')")
    public ResponseEntity<List<BedAllocationRequestResponse>> getBedRequests(
            @RequestParam(required = false) BedAllocationRequestStatus status
    ) {
        return ResponseEntity.ok(bedManagementService.getRequests(status));
    }

    @GetMapping("/bed-assignments")
    @PreAuthorize("hasAnyRole('ADMIN', 'BED_MANAGER', 'NURSE')")
    public ResponseEntity<List<BedAssignmentResponse>> getBedAssignments(
            @RequestParam(required = false) String status
    ) {
        return ResponseEntity.ok(bedManagementService.getAssignments(status));
    }

    @PostMapping("/bed-assignments/{assignmentId}/discharge")
    @PreAuthorize("hasAnyRole('ADMIN', 'BED_MANAGER')")
    public ResponseEntity<BedAssignmentResponse> discharge(@PathVariable Long assignmentId) {
        return ResponseEntity.ok(bedManagementService.dischargePatient(assignmentId));
    }
}
