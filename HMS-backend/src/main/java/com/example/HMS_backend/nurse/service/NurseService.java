package com.example.HMS_backend.nurse.service;

import com.example.HMS_backend.bedmanagement.enums.BedAllocationRequestStatus;
import com.example.HMS_backend.bedmanagement.repository.BedAllocationRequestRepository;
import com.example.HMS_backend.consultation.repository.ConsultationRepository;
import com.example.HMS_backend.encounter.entity.Encounter;
import com.example.HMS_backend.encounter.enums.EncounterStatus;
import com.example.HMS_backend.encounter.repository.EncounterRepository;
import com.example.HMS_backend.entity.User;
import com.example.HMS_backend.exception.ResourceNotFoundException;
import com.example.HMS_backend.nurse.dto.*;
import com.example.HMS_backend.nurse.mapper.NurseMapper;
import com.example.HMS_backend.patient.repository.PatientRepository;
import com.example.HMS_backend.repository.UserRepository;
import com.example.HMS_backend.security.enums.Role;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.EnumSet;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NurseService {

    private final EncounterRepository encounterRepository;
    private final ConsultationRepository consultationRepository;
    private final PatientRepository patientRepository;
    private final UserRepository userRepository;
        private final BedAllocationRequestRepository bedAllocationRequestRepository;
    private final NurseMapper nurseMapper;


    // Get Doctors
    public List<DoctorOption> getDoctors() {
        return userRepository.findByRole(Role.DOCTOR).stream()
                .filter(User::isEnabled)
                .map(nurseMapper::toDoctorOption)
                .toList();
    }

    //  Get Encounters
    public List<DoctorPatientItem> getActiveEncountersForDoctor(Long doctorId) {

        User doctor = userRepository.findById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found"));

        if (doctor.getRole() != Role.DOCTOR) {
            throw new IllegalArgumentException("User is not doctor");
        }

        return encounterRepository.findByDoctorIdOrderByCreatedAtDesc(doctorId)
                .stream()
                .filter(e -> e.getStatus() != EncounterStatus.CANCELLED)
                .map(encounter -> {
                    var patient = patientRepository.findById(encounter.getPatientId()).orElse(null);
                    return nurseMapper.toDoctorPatientItem(encounter, patient);
                })
                .toList();
    }

    //  Patient Case Timeline
    public PatientCaseTimeline getPatientCase(Long encounterId) {

        Encounter encounter = encounterRepository.findById(encounterId)
                .orElseThrow(() -> new ResourceNotFoundException("Encounter not found"));

        var builder = nurseMapper.toPatientCaseBase(encounter);

        patientRepository.findById(encounter.getPatientId())
                .ifPresent(p -> nurseMapper.mapPatientDetails(builder, p));

        userRepository.findById(encounter.getDoctorId())
                .ifPresent(d -> nurseMapper.mapDoctorDetails(builder, d));

        consultationRepository.findByEncounterId(encounterId)
                .ifPresent(c -> nurseMapper.mapConsultationDetails(builder, c));

        return builder;
    }

    //  Dashboard Stats
    public NurseDashboardStats getDashboardStats() {

        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime endOfDay = startOfDay.plusDays(1);

        List<Encounter> todayEncounters =
                encounterRepository.findByCreatedAtBetweenOrderByCreatedAtDesc(startOfDay, endOfDay);

        long waitingCount = todayEncounters.stream()
                .filter(e -> e.getStatus() == EncounterStatus.WAITING)
                .count();

        long inConsultationCount = todayEncounters.stream()
                .filter(e -> e.getStatus() == EncounterStatus.IN_CONSULTATION)
                .count();

        long completedTodayCount = todayEncounters.stream()
                .filter(e -> e.getStatus() == EncounterStatus.COMPLETED)
                .count();

        long activeDoctors = todayEncounters.stream()
                .filter(e -> e.getStatus() == EncounterStatus.WAITING
                        || e.getStatus() == EncounterStatus.IN_CONSULTATION)
                .map(Encounter::getDoctorId)
                .distinct()
                .count();

        long activeEncounters = waitingCount + inConsultationCount;

        long totalEncounters = encounterRepository.count();
        long totalPatients = patientRepository.count();
        long totalConsultations = consultationRepository.count();

        long totalDoctors = userRepository.findByRole(Role.DOCTOR).stream()
                .filter(User::isEnabled).count();

        long todayConsultations = consultationRepository
                .findByCreatedAtBetweenOrderByCreatedAtDesc(startOfDay, endOfDay).size();

        long totalBedRequests = bedAllocationRequestRepository.count();

        long myPendingBedRequests = 0;
        long myTotalBedRequests = 0;

        try {
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            User currentUser = userRepository.findByUsername(username).orElse(null);

            if (currentUser != null) {
                var myRequests = bedAllocationRequestRepository
                        .findByRequestedByOrderByCreatedAtDesc(currentUser.getId());

                myTotalBedRequests = myRequests.size();

                myPendingBedRequests = myRequests.stream()
                        .filter(br -> br.getStatus() == BedAllocationRequestStatus.REQUESTED
                                || br.getStatus() == BedAllocationRequestStatus.UNDER_REVIEW)
                        .count();
            }
        } catch (Exception ignored) {}

        long totalPendingBedRequests = bedAllocationRequestRepository
                .countByStatusIn(EnumSet.of(
                        BedAllocationRequestStatus.REQUESTED,
                        BedAllocationRequestStatus.UNDER_REVIEW
                ));

        return nurseMapper.toDashboardStats(
                activeDoctors,
                activeEncounters,
                waitingCount,
                inConsultationCount,
                completedTodayCount,
                myPendingBedRequests,
                totalPendingBedRequests,
                totalEncounters,
                totalPatients,
                totalConsultations,
                totalDoctors,
                todayEncounters.size(),
                todayConsultations,
                totalBedRequests,
                myTotalBedRequests
        );
    }
}