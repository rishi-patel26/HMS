package com.example.HMS_backend.appointment.mapper;

import com.example.HMS_backend.appointment.dto.AppointmentRequest;
import com.example.HMS_backend.appointment.dto.AppointmentResponse;
import com.example.HMS_backend.appointment.entity.Appointment;
import com.example.HMS_backend.patient.repository.PatientRepository;
import com.example.HMS_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AppointmentMapper {

    private final PatientRepository patientRepository;
    private final UserRepository userRepository;

    public Appointment toEntity(AppointmentRequest request) {
        return Appointment.builder()
                .patientId(request.getPatientId())
                .doctorId(request.getDoctorId())
                .appointmentTime(request.getAppointmentTime())
                .reasonForVisit(request.getReasonForVisit())
                .notes(request.getNotes())
                .priority(request.getPriority())
                .department(request.getDepartment())
                .build();
    }

    public AppointmentResponse toResponse(Appointment appointment) {
        String patientName = "Unknown Patient";
        String patientUhid = "";
        var patientOpt = patientRepository.findById(appointment.getPatientId());
        if (patientOpt.isPresent()) {
            var p = patientOpt.get();
            patientName = p.getFirstName() + " " + p.getLastName();
            patientUhid = p.getUhid();
        }
        String doctorName = userRepository.findById(appointment.getDoctorId())
                .map(u -> u.getUsername())
                .orElse("Unknown Doctor");

        return AppointmentResponse.builder()
                .id(appointment.getId())
                .patientId(appointment.getPatientId())
                .patientName(patientName)
                .patientUhid(patientUhid)
                .doctorId(appointment.getDoctorId())
                .doctorName(doctorName)
                .appointmentTime(appointment.getAppointmentTime())
                .status(appointment.getStatus())
                .reasonForVisit(appointment.getReasonForVisit())
                .notes(appointment.getNotes())
                .priority(appointment.getPriority())
                .department(appointment.getDepartment())
                .createdBy(appointment.getCreatedBy())
                .createdAt(appointment.getCreatedAt())
                .build();
    }
}
