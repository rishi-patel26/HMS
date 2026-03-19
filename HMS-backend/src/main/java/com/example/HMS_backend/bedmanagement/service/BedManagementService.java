package com.example.HMS_backend.bedmanagement.service;

import com.example.HMS_backend.bedmanagement.dto.*;
import com.example.HMS_backend.bedmanagement.entity.*;
import com.example.HMS_backend.bedmanagement.enums.*;
import com.example.HMS_backend.bedmanagement.mapper.BedManagementMapper;
import com.example.HMS_backend.bedmanagement.repository.*;
import com.example.HMS_backend.encounter.entity.Encounter;
import com.example.HMS_backend.encounter.repository.EncounterRepository;
import com.example.HMS_backend.entity.User;
import com.example.HMS_backend.exception.ResourceNotFoundException;
import com.example.HMS_backend.notification.enums.NotificationType;
import com.example.HMS_backend.notification.service.NotificationService;
import com.example.HMS_backend.patient.entity.Patient;
import com.example.HMS_backend.patient.repository.PatientRepository;
import com.example.HMS_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import org.springframework.security.core.context.SecurityContextHolder;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class BedManagementService {

    private static final Set<BedAssignmentStatus> ACTIVE_ASSIGNMENT_STATUSES =
            EnumSet.of(BedAssignmentStatus.ALLOCATED, BedAssignmentStatus.ADMITTED);

    private static final Set<BedAllocationRequestStatus> OPEN_REQUEST_STATUSES =
            EnumSet.of(BedAllocationRequestStatus.REQUESTED, BedAllocationRequestStatus.UNDER_REVIEW);

    private final WardRepository wardRepository;
    private final BedRepository bedRepository;
    private final BedAllocationRequestRepository bedAllocationRequestRepository;
    private final BedAssignmentRepository bedAssignmentRepository;
    private final BedEventRepository bedEventRepository;
    private final EncounterRepository encounterRepository;
    private final PatientRepository patientRepository;
    private final UserRepository userRepository;
    private final BedManagementMapper bedManagementMapper;
    private final NotificationService notificationService;

    @Transactional
    public WardResponse createWard(WardCreateRequest request) {
        Ward ward = bedManagementMapper.toWardEntity(request);
        Ward saved = wardRepository.save(ward);
        return bedManagementMapper.toWardResponse(saved);
    }

    public List<WardResponse> getWardOccupancy() {
        return wardRepository.findAllByOrderByNameAsc().stream()
                .map(bedManagementMapper::toWardResponse)
                .toList();
    }

    @Transactional
    public BedResponse createBed(BedCreateRequest request) {
        Ward ward = wardRepository.findById(request.getWardId())
                .orElseThrow(() -> new ResourceNotFoundException("Ward not found with id: " + request.getWardId()));

        if (Boolean.FALSE.equals(ward.getActive())) {
            throw new IllegalStateException("Cannot add bed to an inactive ward");
        }

        Bed bed = bedManagementMapper.toBedEntity(request, ward);
        Bed saved = bedRepository.save(bed);
        return bedManagementMapper.toBedResponse(saved);
    }

    public List<BedResponse> getBedsByWard(Long wardId) {
        return bedRepository.findByWardIdWithWard(wardId).stream()
                .map(bedManagementMapper::toBedResponse)
                .toList();
    }

    @Transactional
    public BedResponse updateBedStatus(Long bedId, UpdateBedStatusRequest request) {
        Bed bed = bedRepository.findByIdForUpdate(bedId)
                .orElseThrow(() -> new ResourceNotFoundException("Bed not found with id: " + bedId));

        if (bed.getStatus() == BedStatus.OCCUPIED && request.getStatus() == BedStatus.MAINTENANCE) {
            throw new IllegalStateException("Cannot put an occupied bed into maintenance");
        }

        if (request.getStatus() == BedStatus.OCCUPIED) {
            throw new IllegalArgumentException("Bed occupancy must be managed through allocation workflow");
        }

        bed.setStatus(request.getStatus());
        Bed saved = bedRepository.save(bed);
        return bedManagementMapper.toBedResponse(saved);
    }

    @Transactional
    public BedAllocationRequestResponse createAllocationRequest(CreateBedAllocationRequestRequest request) {
        Encounter encounter = encounterRepository.findById(request.getEncounterId())
                .orElseThrow(() -> new ResourceNotFoundException("Encounter not found with id: " + request.getEncounterId()));

        if (!Objects.equals(encounter.getPatientId(), request.getPatientId())) {
            throw new IllegalArgumentException("Patient ID does not match encounter patient");
        }

        if (request.getPreferredWardId() != null) {
            Ward preferredWard = wardRepository.findById(request.getPreferredWardId())
                    .orElseThrow(() -> new ResourceNotFoundException("Preferred ward not found with id: " + request.getPreferredWardId()));
            if (Boolean.FALSE.equals(preferredWard.getActive())) {
                throw new IllegalStateException("Preferred ward is inactive");
            }
        }

        ensureNoActiveAssignment(encounter.getId());
        ensureNoOpenAllocationRequest(encounter.getId());

        User currentUser = getCurrentUser();

        BedAllocationRequest allocationRequest = bedManagementMapper
                .toAllocationRequestEntity(request, currentUser.getId());

        BedAllocationRequest saved = bedAllocationRequestRepository.save(allocationRequest);

        createEvent(saved.getEncounterId(), BedEventType.REQUEST_CREATED, currentUser.getId(), saved.getNotes());

        return toAllocationRequestResponse(saved);
    }

    public BedAllocationRequestResponse getAllocationRequestById(Long requestId) {
        BedAllocationRequest request = bedAllocationRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Allocation request not found with id: " + requestId));
        return toAllocationRequestResponse(request);
    }

    public List<BedAllocationRequestResponse> getAllocationRequestsByEncounter(Long encounterId) {
        return bedAllocationRequestRepository.findByEncounterIdOrderByCreatedAtDesc(encounterId).stream()
                .map(this::toAllocationRequestResponse)
                .toList();
    }

    public List<BedAllocationRequestResponse> getMyAllocationRequests() {
        User currentUser = getCurrentUser();
        return bedAllocationRequestRepository.findByRequestedByOrderByCreatedAtDesc(currentUser.getId()).stream()
                .map(this::toAllocationRequestResponse)
                .toList();
    }

    public List<BedAllocationRequestResponse> getPriorityQueue() {
        return bedAllocationRequestRepository
            .findByStatusInOrderByCreatedAtAsc(OPEN_REQUEST_STATUSES)
            .stream()
            .sorted(Comparator
                .comparingInt((BedAllocationRequest br) -> priorityWeight(br.getPriority())).reversed()
                .thenComparing(BedAllocationRequest::getCreatedAt))
                .map(this::toAllocationRequestResponse)
                .toList();
    }

    @Transactional
    public BedAllocationRequestResponse markRequestUnderReview(Long requestId, MarkUnderReviewRequest request) {
        BedAllocationRequest allocationRequest = bedAllocationRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Allocation request not found with id: " + requestId));

        if (allocationRequest.getStatus() != BedAllocationRequestStatus.REQUESTED) {
            throw new IllegalStateException("Only REQUESTED items can move to UNDER_REVIEW");
        }

        allocationRequest.setStatus(BedAllocationRequestStatus.UNDER_REVIEW);
        if (StringUtils.hasText(request.getNotes())) {
            allocationRequest.setNotes(request.getNotes().trim());
        }

        BedAllocationRequest saved = bedAllocationRequestRepository.save(allocationRequest);

        createEvent(saved.getEncounterId(), BedEventType.UNDER_REVIEW, getCurrentUser().getId(), request.getNotes());

        return toAllocationRequestResponse(saved);
    }

    @Transactional
    public BedAllocationRequestResponse rejectRequest(Long requestId, RejectBedAllocationRequest request) {
        BedAllocationRequest allocationRequest = bedAllocationRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Allocation request not found with id: " + requestId));

        if (allocationRequest.getStatus() == BedAllocationRequestStatus.ALLOCATED
                || allocationRequest.getStatus() == BedAllocationRequestStatus.REJECTED) {
            throw new IllegalStateException("Request already closed and cannot be rejected");
        }

        allocationRequest.setStatus(BedAllocationRequestStatus.REJECTED);
        allocationRequest.setNotes(request.getNotes().trim());

        BedAllocationRequest saved = bedAllocationRequestRepository.save(allocationRequest);

        createEvent(saved.getEncounterId(), BedEventType.REQUEST_REJECTED, getCurrentUser().getId(), request.getNotes());

        return toAllocationRequestResponse(saved);
    }

    @Transactional
    public BedAssignmentResponse allocateBed(Long requestId, AllocateBedRequest request) {
        BedAllocationRequest allocationRequest = bedAllocationRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Allocation request not found with id: " + requestId));

        if (allocationRequest.getStatus() != BedAllocationRequestStatus.UNDER_REVIEW) {
            throw new IllegalStateException("Allocation is allowed only for UNDER_REVIEW requests");
        }

        ensureNoActiveAssignment(allocationRequest.getEncounterId());

        Bed bed = bedRepository.findByIdForUpdate(request.getBedId())
                .orElseThrow(() -> new ResourceNotFoundException("Bed not found with id: " + request.getBedId()));

        Ward ward = wardRepository.findByIdForUpdate(bed.getWard().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Ward not found with id: " + bed.getWard().getId()));

        if (bed.getStatus() != BedStatus.AVAILABLE) {
            throw new IllegalStateException("Bed must be AVAILABLE before allocation");
        }

        if (Boolean.FALSE.equals(ward.getActive())) {
            throw new IllegalStateException("Cannot allocate bed from inactive ward");
        }

        if (!Objects.equals(bed.getBedType(), allocationRequest.getRequiredBedType())) {
            throw new IllegalArgumentException("Selected bed type does not satisfy requested bed type");
        }

        if (allocationRequest.getPreferredWardId() != null
                && !Objects.equals(ward.getId(), allocationRequest.getPreferredWardId())) {
            throw new IllegalArgumentException("Selected bed is not in preferred ward");
        }

        int occupiedBeds = ward.getOccupiedBeds() == null ? 0 : ward.getOccupiedBeds();
        int capacity = ward.getCapacity() == null ? 0 : ward.getCapacity();

        if (occupiedBeds >= capacity) {
            throw new IllegalStateException("Ward capacity exceeded");
        }

        User currentUser = getCurrentUser();

        BedAssignment assignment = BedAssignment.builder()
                .encounterId(allocationRequest.getEncounterId())
                .bedId(bed.getId())
                .assignedBy(currentUser.getId())
                .assignedAt(LocalDateTime.now())
                .status(BedAssignmentStatus.ALLOCATED)
                .build();

        BedAssignment savedAssignment = bedAssignmentRepository.save(assignment);

        bed.setStatus(BedStatus.OCCUPIED);
        bedRepository.save(bed);

        ward.setOccupiedBeds(occupiedBeds + 1);
        wardRepository.save(ward);

        allocationRequest.setStatus(BedAllocationRequestStatus.ALLOCATED);
        if (StringUtils.hasText(request.getNotes())) {
            allocationRequest.setNotes(request.getNotes().trim());
        }
        bedAllocationRequestRepository.save(allocationRequest);

        createEvent(allocationRequest.getEncounterId(), BedEventType.BED_ALLOCATED, currentUser.getId(), request.getNotes());

        // Notify FRONTDESK role about the bed allocation
        Patient patient = patientRepository.findById(allocationRequest.getPatientId()).orElse(null);
        String patientName = patient != null
                ? patient.getFirstName() + " " + patient.getLastName()
                : "Patient #" + allocationRequest.getPatientId();
        notificationService.notifyRole(
                "Bed " + bed.getBedNumber() + " allocated to patient " + patientName + " in ward " + ward.getName(),
                NotificationType.BED_ALLOCATION,
                "FRONTDESK"
        );

        return toAssignmentResponse(savedAssignment);
    }

    @Transactional
    public BedAssignmentResponse admitPatient(Long assignmentId) {
        BedAssignment assignment = bedAssignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found with id: " + assignmentId));

        if (assignment.getStatus() != BedAssignmentStatus.ALLOCATED) {
            throw new IllegalStateException("Cannot admit without ALLOCATED assignment");
        }

        assignment.setStatus(BedAssignmentStatus.ADMITTED);
        assignment.setAdmittedAt(LocalDateTime.now());

        BedAssignment saved = bedAssignmentRepository.save(assignment);

        createEvent(saved.getEncounterId(), BedEventType.PATIENT_ADMITTED, getCurrentUser().getId(), "Patient admitted");

        return toAssignmentResponse(saved);
    }

    @Transactional
    public BedAssignmentResponse dischargePatient(Long assignmentId) {
        BedAssignment assignment = bedAssignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found with id: " + assignmentId));

        if (assignment.getStatus() != BedAssignmentStatus.ADMITTED) {
            throw new IllegalStateException("Cannot discharge without ADMITTED assignment");
        }

        Bed bed = bedRepository.findByIdForUpdate(assignment.getBedId())
                .orElseThrow(() -> new ResourceNotFoundException("Bed not found with id: " + assignment.getBedId()));

        Ward ward = wardRepository.findByIdForUpdate(bed.getWard().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Ward not found with id: " + bed.getWard().getId()));

        assignment.setStatus(BedAssignmentStatus.COMPLETED);
        assignment.setDischargedAt(LocalDateTime.now());

        BedAssignment saved = bedAssignmentRepository.save(assignment);

        bed.setStatus(BedStatus.AVAILABLE);
        bedRepository.save(bed);

        int occupiedBeds = ward.getOccupiedBeds() == null ? 0 : ward.getOccupiedBeds();
        ward.setOccupiedBeds(Math.max(occupiedBeds - 1, 0));
        wardRepository.save(ward);

        Long currentUserId = getCurrentUser().getId();
        createEvent(saved.getEncounterId(), BedEventType.PATIENT_DISCHARGED, currentUserId, "Patient discharged");
        createEvent(saved.getEncounterId(), BedEventType.BED_RELEASED, currentUserId, "Bed released after discharge");

        return toAssignmentResponse(saved);
    }

    @Transactional
    public BedAssignmentResponse transferBed(Long assignmentId, TransferBedRequest request) {
        BedAssignment assignment = bedAssignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found with id: " + assignmentId));

        if (assignment.getStatus() != BedAssignmentStatus.ADMITTED) {
            throw new IllegalStateException("Bed transfer is allowed only for ADMITTED assignments");
        }

        if (Objects.equals(assignment.getBedId(), request.getNewBedId())) {
            throw new IllegalArgumentException("New bed must be different from current bed");
        }

        Bed currentBed = bedRepository.findByIdForUpdate(assignment.getBedId())
                .orElseThrow(() -> new ResourceNotFoundException("Current bed not found with id: " + assignment.getBedId()));

        Bed newBed = bedRepository.findByIdForUpdate(request.getNewBedId())
                .orElseThrow(() -> new ResourceNotFoundException("New bed not found with id: " + request.getNewBedId()));

        Ward oldWard = wardRepository.findByIdForUpdate(currentBed.getWard().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Old ward not found with id: " + currentBed.getWard().getId()));

        Ward newWard = wardRepository.findByIdForUpdate(newBed.getWard().getId())
                .orElseThrow(() -> new ResourceNotFoundException("New ward not found with id: " + newBed.getWard().getId()));

        if (newBed.getStatus() != BedStatus.AVAILABLE) {
            throw new IllegalStateException("Target bed must be AVAILABLE for transfer");
        }

        if (Boolean.FALSE.equals(newWard.getActive())) {
            throw new IllegalStateException("Cannot transfer patient to an inactive ward");
        }

        int newWardOccupied = newWard.getOccupiedBeds() == null ? 0 : newWard.getOccupiedBeds();
        int newWardCapacity = newWard.getCapacity() == null ? 0 : newWard.getCapacity();

        if (!Objects.equals(oldWard.getId(), newWard.getId()) && newWardOccupied >= newWardCapacity) {
            throw new IllegalStateException("Target ward capacity exceeded");
        }

        Long performedBy = getCurrentUser().getId();
        String notes = StringUtils.hasText(request.getNotes()) ? request.getNotes().trim() : "Patient transferred to another bed";

        currentBed.setStatus(BedStatus.AVAILABLE);
        bedRepository.save(currentBed);

        newBed.setStatus(BedStatus.OCCUPIED);
        bedRepository.save(newBed);

        if (!Objects.equals(oldWard.getId(), newWard.getId())) {
            int oldWardOccupied = oldWard.getOccupiedBeds() == null ? 0 : oldWard.getOccupiedBeds();
            oldWard.setOccupiedBeds(Math.max(oldWardOccupied - 1, 0));
            wardRepository.save(oldWard);

            newWard.setOccupiedBeds(newWardOccupied + 1);
            wardRepository.save(newWard);
        }

        assignment.setBedId(newBed.getId());
        BedAssignment saved = bedAssignmentRepository.save(assignment);

        createEvent(saved.getEncounterId(), BedEventType.BED_RELEASED, performedBy,
                "Released bed " + currentBed.getBedNumber() + " due to transfer");
        createEvent(saved.getEncounterId(), BedEventType.BED_TRANSFERRED, performedBy,
                "Transferred to bed " + newBed.getBedNumber() + " in ward " + newBed.getWard().getName() + ". " + notes);

        return toAssignmentResponse(saved);
    }

    @Transactional
    public BedAssignmentResponse completeAssignment(Long assignmentId) {
        BedAssignment assignment = bedAssignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found with id: " + assignmentId));

        if (assignment.getStatus() != BedAssignmentStatus.DISCHARGED) {
            throw new IllegalStateException("Only DISCHARGED assignments can be completed");
        }

        assignment.setStatus(BedAssignmentStatus.COMPLETED);
        BedAssignment saved = bedAssignmentRepository.save(assignment);
        return toAssignmentResponse(saved);
    }

    public List<BedResponse> getAvailableBeds(BedType bedType, Long wardId) {
        return bedRepository.findAvailableBeds(BedStatus.AVAILABLE, bedType, wardId).stream()
                .map(bedManagementMapper::toBedResponse)
                .toList();
    }

    public List<BedResponse> getAssignableBeds(BedType bedType, Long preferredWardId, Long excludeBedId) {
        if (bedType == null) {
            throw new IllegalArgumentException("Bed type is required to fetch assignable beds");
        }

        return bedRepository.findAssignableBeds(bedType, preferredWardId, excludeBedId).stream()
                .map(bedManagementMapper::toBedResponse)
                .toList();
    }

    public List<BedResponse> getBeds(BedStatus status) {
        if (status != null) {
            return bedRepository.findAvailableBeds(status, null, null).stream()
                    .map(bedManagementMapper::toBedResponse)
                    .toList();
        }

        return bedRepository.findAllWithWard().stream()
                .map(bedManagementMapper::toBedResponse)
                .toList();
    }

    public List<BedAllocationRequestResponse> getRequests(BedAllocationRequestStatus status) {
        if (status == null) {
            return bedAllocationRequestRepository.findAll().stream()
                    .sorted(Comparator.comparing(BedAllocationRequest::getCreatedAt).reversed())
                    .map(this::toAllocationRequestResponse)
                    .toList();
        }

        if (status == BedAllocationRequestStatus.REQUESTED) {
            return bedAllocationRequestRepository.findByStatusOrderByCreatedAtAsc(status).stream()
                    .sorted(Comparator
                            .comparingInt((BedAllocationRequest br) -> priorityWeight(br.getPriority())).reversed()
                            .thenComparing(BedAllocationRequest::getCreatedAt))
                    .map(this::toAllocationRequestResponse)
                    .toList();
        }

        return bedAllocationRequestRepository.findByStatusOrderByCreatedAtAsc(status).stream()
                .map(this::toAllocationRequestResponse)
                .toList();
    }

    public List<BedAssignmentResponse> getAssignments(String status) {
        if (!StringUtils.hasText(status)) {
            return bedAssignmentRepository.findAllByOrderByAssignedAtDesc().stream()
                    .map(this::toAssignmentResponse)
                    .toList();
        }

        if ("ACTIVE".equalsIgnoreCase(status)) {
            return getActiveAssignments();
        }

        BedAssignmentStatus parsedStatus;
        try {
            parsedStatus = BedAssignmentStatus.valueOf(status.toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Unsupported assignment status: " + status);
        }

        return bedAssignmentRepository.findByStatusInOrderByAssignedAtDesc(Set.of(parsedStatus)).stream()
                .map(this::toAssignmentResponse)
                .toList();
    }

    public List<BedCalendarDayResponse> getMonthlyBedCalendar(int year, int month) {
        if (month < 1 || month > 12) {
            throw new IllegalArgumentException("Month must be between 1 and 12");
        }

        LocalDate monthStart = LocalDate.of(year, month, 1);
        LocalDate monthEnd = monthStart.withDayOfMonth(monthStart.lengthOfMonth());

        LocalDateTime rangeStart = monthStart.atStartOfDay();
        LocalDateTime rangeEnd = monthEnd.plusDays(1).atStartOfDay().minusNanos(1);

        List<Bed> allBeds = bedRepository.findAllWithWard();
        int totalBeds = allBeds.size();
        int maintenanceBeds = (int) allBeds.stream()
                .filter(b -> b.getStatus() == BedStatus.MAINTENANCE)
                .count();

        List<BedAssignment> overlappingAssignments = bedAssignmentRepository
                .findAssignmentsOverlappingRange(rangeStart, rangeEnd);

        List<BedCalendarDayResponse> calendar = new ArrayList<>();
        LocalDate cursor = monthStart;
        while (!cursor.isAfter(monthEnd)) {
            LocalDate currentDate = cursor;

            int occupied = (int) overlappingAssignments.stream()
                    .filter(a -> !a.getAssignedAt().toLocalDate().isAfter(currentDate))
                    .filter(a -> a.getDischargedAt() == null || !a.getDischargedAt().toLocalDate().isBefore(currentDate))
                    .count();

            int available = Math.max(totalBeds - maintenanceBeds - occupied, 0);

            calendar.add(BedCalendarDayResponse.builder()
                    .date(currentDate)
                    .availableBeds(available)
                    .occupiedBeds(occupied)
                    .maintenanceBeds(maintenanceBeds)
                    .build());

            cursor = cursor.plusDays(1);
        }

        return calendar;
    }

    public List<BedAssignmentResponse> getActiveAssignments() {
        return bedAssignmentRepository.findByStatusInOrderByAssignedAtDesc(ACTIVE_ASSIGNMENT_STATUSES).stream()
                .map(this::toAssignmentResponse)
                .toList();
    }

    public List<BedEventResponse> getTimelineByRequestId(Long requestId) {
        BedAllocationRequest request = bedAllocationRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Allocation request not found with id: " + requestId));

        return bedEventRepository.findByEncounterIdOrderByTimestampAsc(request.getEncounterId()).stream()
                .map(this::toEventResponse)
                .toList();
    }

    public BedManagerDashboardResponse getBedManagerDashboard() {
        return BedManagerDashboardResponse.builder()
                .priorityQueue(getPriorityQueue())
                .wardOccupancy(getWardOccupancy())
                .availableBeds(getBeds(BedStatus.AVAILABLE))
                .activeAssignments(getActiveAssignments())
                .build();
    }

    private int priorityWeight(BedAllocationPriority priority) {
        if (priority == BedAllocationPriority.EMERGENCY) {
            return 3;
        }
        if (priority == BedAllocationPriority.URGENT) {
            return 2;
        }
        return 1;
    }

    private void ensureNoActiveAssignment(Long encounterId) {
        bedAssignmentRepository.findTopByEncounterIdAndStatusInOrderByAssignedAtDesc(encounterId, ACTIVE_ASSIGNMENT_STATUSES)
                .ifPresent(assignment -> {
                    throw new IllegalStateException("Encounter already has an active bed assignment");
                });
    }

    private void ensureNoOpenAllocationRequest(Long encounterId) {
        bedAllocationRequestRepository.findTopByEncounterIdAndStatusInOrderByCreatedAtDesc(encounterId, OPEN_REQUEST_STATUSES)
                .ifPresent(request -> {
                    throw new IllegalStateException("Encounter already has an open bed allocation request");
                });
    }

    private void createEvent(Long encounterId, BedEventType eventType, Long performedBy, String notes) {
        BedEvent event = bedManagementMapper.toEventEntity(encounterId, eventType, performedBy, notes);
        bedEventRepository.save(event);
    }

    private BedAllocationRequestResponse toAllocationRequestResponse(BedAllocationRequest request) {
        Encounter encounter = encounterRepository.findById(request.getEncounterId()).orElse(null);
        Patient patient = patientRepository.findById(request.getPatientId()).orElse(null);
        User requestedByUser = userRepository.findById(request.getRequestedBy()).orElse(null);
        Ward preferredWard = request.getPreferredWardId() == null
                ? null
                : wardRepository.findById(request.getPreferredWardId()).orElse(null);

        return bedManagementMapper.toAllocationRequestResponse(
                request,
                encounter != null ? encounter.getEncounterNumber() : null,
                patient != null ? patient.getFirstName() + " " + patient.getLastName() : null,
                patient != null ? patient.getUhid() : null,
                requestedByUser != null ? requestedByUser.getUsername() : null,
                preferredWard != null ? preferredWard.getName() : null
        );
    }

    private BedAssignmentResponse toAssignmentResponse(BedAssignment assignment) {
        Bed bed = bedRepository.findById(assignment.getBedId())
                .orElseThrow(() -> new ResourceNotFoundException("Bed not found with id: " + assignment.getBedId()));

        User assignedByUser = userRepository.findById(assignment.getAssignedBy()).orElse(null);
        return bedManagementMapper.toAssignmentResponse(
                assignment,
                bed,
                assignedByUser != null ? assignedByUser.getUsername() : null
        );
    }

    private BedEventResponse toEventResponse(BedEvent event) {
        User user = userRepository.findById(event.getPerformedBy()).orElse(null);
        String performedByName = user != null ? user.getUsername() : null;
        return bedManagementMapper.toEventResponse(event, performedByName);
    }

    private User getCurrentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Current user not found"));
    }
}
