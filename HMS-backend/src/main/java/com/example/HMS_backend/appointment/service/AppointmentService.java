package com.example.HMS_backend.appointment.service;

import com.example.HMS_backend.appointment.dto.AppointmentRequest;
import com.example.HMS_backend.appointment.dto.AppointmentResponse;
import com.example.HMS_backend.appointment.entity.Appointment;
import com.example.HMS_backend.appointment.enums.AppointmentStatus;
import com.example.HMS_backend.appointment.mapper.AppointmentMapper;
import com.example.HMS_backend.appointment.repository.AppointmentRepository;
import com.example.HMS_backend.entity.User;
import com.example.HMS_backend.exception.ResourceNotFoundException;
import com.example.HMS_backend.notification.enums.NotificationType;
import com.example.HMS_backend.notification.service.NotificationService;
import com.example.HMS_backend.patient.entity.Patient;
import com.example.HMS_backend.patient.repository.PatientRepository;
import com.example.HMS_backend.repository.UserRepository;
import com.example.HMS_backend.security.enums.Role;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AppointmentService {

    private static final DateTimeFormatter NOTIFICATION_FORMATTER =
            DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a");

    private final AppointmentRepository appointmentRepository;
    private final AppointmentMapper appointmentMapper;
    private final UserRepository userRepository;
    private final PatientRepository patientRepository;
    private final NotificationService notificationService;

    @Transactional
    public AppointmentResponse createAppointment(AppointmentRequest request) {
        // Validate that doctorId belongs to a user with DOCTOR role
        User doctor = userRepository.findById(request.getDoctorId())
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with id: " + request.getDoctorId()));
        if (doctor.getRole() != Role.DOCTOR) {
            throw new IllegalArgumentException("User with id " + request.getDoctorId() + " is not a doctor");
        }
        if (!doctor.isEnabled()) {
            throw new IllegalArgumentException("Doctor with id " + request.getDoctorId() + " is not active");
        }

        // Check for time conflicts - no two patients can book the same doctor at the same time
        LocalDateTime requestedTime = request.getAppointmentTime();

        // Validate appointment is not in the past
        if (requestedTime.isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Appointment cannot be booked for a past date or time. Please select a valid future time.");
        }

        LocalDateTime windowStart = requestedTime.minusMinutes(29);
        LocalDateTime windowEnd = requestedTime.plusMinutes(29);
        List<Appointment> conflicts = appointmentRepository.findByDoctorIdAndAppointmentTimeBetweenAndStatusNot(
            request.getDoctorId(), windowStart, windowEnd, AppointmentStatus.CANCELLED);
        if (!conflicts.isEmpty()) {
            throw new IllegalArgumentException("Doctor already has an appointment at this time. Please choose a different time slot.");
        }

        Appointment appointment = appointmentMapper.toEntity(request);
        Appointment saved = appointmentRepository.save(appointment);

        // Notify ONLY the assigned doctor about the new appointment (user-specific notification)
        Patient patient = patientRepository.findById(request.getPatientId()).orElse(null);
        String patientName = patient != null
                ? patient.getFirstName() + " " + patient.getLastName()
                : "Patient #" + request.getPatientId();
        String formattedTime = saved.getAppointmentTime().format(NOTIFICATION_FORMATTER);
        
        String notificationMessage = String.format(
            "New appointment booked for you at %s with patient %s", 
            formattedTime, 
            patientName
        );
        
        log.info("Sending appointment notification to doctor '{}' for appointment ID {}", 
            doctor.getUsername(), saved.getId());
        
        notificationService.notifyUser(
                notificationMessage,
                NotificationType.APPOINTMENT,
                doctor.getUsername()
        );

        return appointmentMapper.toResponse(saved);
    }

    public AppointmentResponse getAppointmentById(Long id) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with id: " + id));
        return appointmentMapper.toResponse(appointment);
    }

    public List<AppointmentResponse> getAllAppointments() {
        return appointmentRepository.findAll().stream()
                .map(appointmentMapper::toResponse)
                .toList();
    }

    public List<AppointmentResponse> getAppointmentsByPatient(Long patientId) {
        return appointmentRepository.findByPatientIdOrderByAppointmentTimeDesc(patientId).stream()
                .map(appointmentMapper::toResponse)
                .toList();
    }

    @Transactional
    public AppointmentResponse updateAppointmentStatus(Long id, AppointmentStatus status) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with id: " + id));
        appointment.setStatus(status);
        Appointment saved = appointmentRepository.save(appointment);
        return appointmentMapper.toResponse(saved);
    }

    @Transactional
    public AppointmentResponse updateAppointment(Long id, AppointmentRequest request) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with id: " + id));

        // Validate that doctorId belongs to a user with DOCTOR role
        User doctor = userRepository.findById(request.getDoctorId())
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with id: " + request.getDoctorId()));
        if (doctor.getRole() != Role.DOCTOR) {
            throw new IllegalArgumentException("User with id " + request.getDoctorId() + " is not a doctor");
        }
        if (!doctor.isEnabled()) {
            throw new IllegalArgumentException("Doctor with id " + request.getDoctorId() + " is not active");
        }

        // Validate appointment is not in the past
        LocalDateTime requestedTime = request.getAppointmentTime();
        if (requestedTime.isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Appointment cannot be scheduled for a past date or time. Please select a valid future time.");
        }

        // Check for time conflicts - exclude current appointment from conflict check
        LocalDateTime windowStart = requestedTime.minusMinutes(29);
        LocalDateTime windowEnd = requestedTime.plusMinutes(29);
        List<Appointment> conflicts = appointmentRepository.findByDoctorIdAndAppointmentTimeBetweenAndStatusNot(
            request.getDoctorId(), windowStart, windowEnd, AppointmentStatus.CANCELLED);
        
        // Remove current appointment from conflicts
        conflicts = conflicts.stream()
                .filter(a -> !a.getId().equals(id))
                .toList();
        
        if (!conflicts.isEmpty()) {
            throw new IllegalArgumentException("Doctor already has an appointment at this time. Please choose a different time slot.");
        }

        // Update appointment fields
        appointment.setPatientId(request.getPatientId());
        appointment.setDoctorId(request.getDoctorId());
        appointment.setAppointmentTime(request.getAppointmentTime());
        appointment.setReasonForVisit(request.getReasonForVisit());
        appointment.setNotes(request.getNotes());

        Appointment saved = appointmentRepository.save(appointment);

        // Notify the assigned doctor about the updated appointment
        Patient patient = patientRepository.findById(request.getPatientId()).orElse(null);
        String patientName = patient != null
                ? patient.getFirstName() + " " + patient.getLastName()
                : "Patient #" + request.getPatientId();
        String formattedTime = saved.getAppointmentTime().format(NOTIFICATION_FORMATTER);
        
        String notificationMessage = String.format(
            "Appointment updated for %s with patient %s", 
            formattedTime, 
            patientName
        );
        
        log.info("Sending appointment update notification to doctor '{}' for appointment ID {}", 
            doctor.getUsername(), saved.getId());
        
        notificationService.notifyUser(
                notificationMessage,
                NotificationType.APPOINTMENT,
                doctor.getUsername()
        );

        return appointmentMapper.toResponse(saved);
    }

    public List<AppointmentResponse> getTodayAppointments() {
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime endOfDay = startOfDay.plusDays(1);
        return appointmentRepository.findByAppointmentTimeBetweenOrderByAppointmentTimeAsc(startOfDay, endOfDay).stream()
                .map(appointmentMapper::toResponse)
                .toList();
    }

    public List<AppointmentResponse> getAppointmentsByDate(LocalDate date) {
        LocalDateTime startOfDay = date.atStartOfDay();
        LocalDateTime endOfDay = startOfDay.plusDays(1);
        return appointmentRepository.findByAppointmentTimeBetweenOrderByAppointmentTimeAsc(startOfDay, endOfDay).stream()
                .map(appointmentMapper::toResponse)
                .toList();
    }

    public List<AppointmentResponse> getDoctorTodayAppointments(String doctorUsername) {
        User doctor = userRepository.findByUsername(doctorUsername)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found: " + doctorUsername));
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime endOfDay = startOfDay.plusDays(1);
        return appointmentRepository.findByDoctorIdAndAppointmentTimeBetweenOrderByAppointmentTimeAsc(
                doctor.getId(), startOfDay, endOfDay).stream()
                .map(appointmentMapper::toResponse)
                .toList();
    }

    public List<AppointmentResponse> getDoctorAllAppointments(String doctorUsername) {
        User doctor = userRepository.findByUsername(doctorUsername)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found: " + doctorUsername));
        return appointmentRepository.findByDoctorIdOrderByAppointmentTimeDesc(doctor.getId()).stream()
                .map(appointmentMapper::toResponse)
                .toList();
    }

    public List<AppointmentResponse> getDoctorAppointmentsByDate(String doctorUsername, LocalDate date) {
        User doctor = userRepository.findByUsername(doctorUsername)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found: " + doctorUsername));
        LocalDateTime startOfDay = date.atStartOfDay();
        LocalDateTime endOfDay = startOfDay.plusDays(1);
        return appointmentRepository.findByDoctorIdAndAppointmentTimeBetweenOrderByAppointmentTimeAsc(
                doctor.getId(), startOfDay, endOfDay).stream()
                .map(appointmentMapper::toResponse)
                .toList();
    }

    public List<AppointmentResponse> getDoctorAppointmentsByDateRange(String doctorUsername, LocalDate from, LocalDate to) {
        User doctor = userRepository.findByUsername(doctorUsername)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found: " + doctorUsername));
        LocalDateTime startDateTime = from.atStartOfDay();
        LocalDateTime endDateTime = to.atTime(23, 59, 59);
        return appointmentRepository.findByDoctorIdAndAppointmentTimeBetweenOrderByAppointmentTimeAsc(
                doctor.getId(), startDateTime, endDateTime).stream()
                .map(appointmentMapper::toResponse)
                .toList();
    }

    @Transactional
    public void deleteAppointment(Long id) {
        appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with id: " + id));
        appointmentRepository.deleteById(id);
    }
}
