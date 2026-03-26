package com.example.HMS_backend.encounter.service;

import com.example.HMS_backend.appointment.entity.Appointment;
import com.example.HMS_backend.appointment.enums.AppointmentStatus;
import com.example.HMS_backend.appointment.repository.AppointmentRepository;
import com.example.HMS_backend.encounter.dto.EncounterRequest;
import com.example.HMS_backend.encounter.dto.EncounterResponse;
import com.example.HMS_backend.encounter.entity.Encounter;
import com.example.HMS_backend.encounter.enums.EncounterStatus;
import com.example.HMS_backend.encounter.mapper.EncounterMapper;
import com.example.HMS_backend.encounter.repository.EncounterRepository;
import com.example.HMS_backend.episode.entity.Episode;
import com.example.HMS_backend.episode.repository.EpisodeRepository;
import com.example.HMS_backend.entity.User;
import com.example.HMS_backend.exception.ResourceNotFoundException;
import com.example.HMS_backend.repository.UserRepository;
import com.example.HMS_backend.security.enums.Role;
import com.example.HMS_backend.util.EncounterNumberGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class EncounterService {

    private final EncounterRepository encounterRepository;
    private final EncounterMapper encounterMapper;
    private final EncounterNumberGenerator encounterNumberGenerator;
    private final AppointmentRepository appointmentRepository;
    private final EpisodeRepository episodeRepository;
    private final UserRepository userRepository;

    @Transactional
    public EncounterResponse checkInPatient(EncounterRequest request) {
        // Validate doctor exists and has DOCTOR role
        User doctor = userRepository.findById(request.getDoctorId())
                .orElseThrow(() -> new IllegalArgumentException("Doctor not found with id: " + request.getDoctorId()));
        if (doctor.getRole() != Role.DOCTOR) {
            throw new IllegalArgumentException("User with id " + request.getDoctorId() + " is not a doctor");
        }

        // Validate that patient has a booked appointment
        if (request.getAppointmentId() == null) {
            throw new IllegalArgumentException("Appointment ID is required. Patient must have a booked appointment before check-in.");
        }

        Appointment appointment = appointmentRepository.findById(request.getAppointmentId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Appointment not found with id: " + request.getAppointmentId()));

        if (appointment.getStatus() != AppointmentStatus.SCHEDULED) {
            throw new IllegalArgumentException("Appointment is not in SCHEDULED status. Current status: " + appointment.getStatus());
        }

        // Verify appointment belongs to the same patient
        if (!appointment.getPatientId().equals(request.getPatientId())) {
            throw new IllegalArgumentException("Appointment does not belong to the selected patient.");
        }

        // Verify appointment is for the same doctor
        if (!appointment.getDoctorId().equals(request.getDoctorId())) {
            throw new IllegalArgumentException("Appointment is not assigned to the selected doctor.");
        }

        Encounter encounter = encounterMapper.toEntity(request);
        encounter.setEncounterNumber(encounterNumberGenerator.generateEncounterNumber());

        LocalDateTime now = LocalDateTime.now();
        encounter.setCheckinTime(now);
        encounter.setVisitDate(now);

        // Mark appointment as CHECKED_IN
        appointment.setStatus(AppointmentStatus.CHECKED_IN);
        appointmentRepository.save(appointment);

        Encounter saved = encounterRepository.save(encounter);
        return encounterMapper.toResponse(saved);
    }

    public EncounterResponse getEncounterById(Long id) {
        Encounter encounter = encounterRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Encounter not found with id: " + id));
        return encounterMapper.toResponse(encounter);
    }

    public List<EncounterResponse> getEncountersByPatient(Long patientId) {
        return encounterRepository.findByPatientIdOrderByCreatedAtDesc(patientId).stream()
                .map(encounterMapper::toResponse)
                .toList();
    }

    @Transactional
    public EncounterResponse updateEncounterStatus(Long id, EncounterStatus status) {
        Encounter encounter = encounterRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Encounter not found with id: " + id));
        encounter.setStatus(status);
        Encounter saved = encounterRepository.save(encounter);
        return encounterMapper.toResponse(saved);
    }

    @Transactional
    public EncounterResponse linkEpisode(Long encounterId, Long episodeId) {
        Encounter encounter = encounterRepository.findById(encounterId)
                .orElseThrow(() -> new ResourceNotFoundException("Encounter not found with id: " + encounterId));

        Episode episode = episodeRepository.findById(episodeId)
                .orElseThrow(() -> new ResourceNotFoundException("Episode not found with id: " + episodeId));

        // Ensure episode belongs to the same patient
        if (!episode.getPatientId().equals(encounter.getPatientId())) {
            throw new IllegalArgumentException("Episode does not belong to the same patient as the encounter");
        }

        encounter.setEpisodeId(episodeId);
        Encounter saved = encounterRepository.save(encounter);
        return encounterMapper.toResponse(saved);
    }

    @Transactional
    public EncounterResponse linkEpisodeToEncounter(Long encounterId, Long episodeId) {
        Encounter encounter = encounterRepository.findById(encounterId)
                .orElseThrow(() -> new ResourceNotFoundException("Encounter not found with id: " + encounterId));
        encounter.setEpisodeId(episodeId);
        Encounter saved = encounterRepository.save(encounter);
        return encounterMapper.toResponse(saved);
    }

    public List<EncounterResponse> getTodayEncounters() {
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime endOfDay = startOfDay.plusDays(1);
        return encounterRepository.findByCreatedAtBetweenOrderByCreatedAtDesc(startOfDay, endOfDay).stream()
                .map(encounterMapper::toResponse)
                .toList();
    }

    public List<EncounterResponse> getEncountersByDate(LocalDate date) {
        LocalDateTime startOfDay = date.atStartOfDay();
        LocalDateTime endOfDay = startOfDay.plusDays(1);
        return encounterRepository.findByCreatedAtBetweenOrderByCreatedAtDesc(startOfDay, endOfDay).stream()
                .map(encounterMapper::toResponse)
                .toList();
    }

    public List<EncounterResponse> getDoctorTodayEncounters(String doctorUsername) {
        User doctor = userRepository.findByUsername(doctorUsername)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found: " + doctorUsername));
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime endOfDay = startOfDay.plusDays(1);
        return encounterRepository.findByDoctorIdAndCreatedAtBetweenOrderByCreatedAtDesc(
                doctor.getId(), startOfDay, endOfDay).stream()
                .map(encounterMapper::toResponse)
                .toList();
    }

    public List<EncounterResponse> getDoctorAllEncounters(String doctorUsername) {
        User doctor = userRepository.findByUsername(doctorUsername)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found: " + doctorUsername));
        return encounterRepository.findByDoctorIdOrderByCreatedAtDesc(doctor.getId()).stream()
                .map(encounterMapper::toResponse)
                .toList();
    }

    public List<EncounterResponse> getDoctorEncountersByDate(String doctorUsername, LocalDate date) {
        User doctor = userRepository.findByUsername(doctorUsername)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found: " + doctorUsername));
        LocalDateTime startOfDay = date.atStartOfDay();
        LocalDateTime endOfDay = startOfDay.plusDays(1);
        return encounterRepository.findByDoctorIdAndCreatedAtBetweenOrderByCreatedAtDesc(
                doctor.getId(), startOfDay, endOfDay).stream()
                .map(encounterMapper::toResponse)
                .toList();
    }

    public List<EncounterResponse> getEncountersByEpisode(Long episodeId) {
        return encounterRepository.findByEpisodeIdOrderByCreatedAtDesc(episodeId).stream()
                .map(encounterMapper::toResponse)
                .toList();
    }
}
