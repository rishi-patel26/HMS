package com.example.HMS_backend.nurse.mapper;

import com.example.HMS_backend.consultation.entity.Consultation;
import com.example.HMS_backend.encounter.entity.Encounter;
import com.example.HMS_backend.entity.User;
import com.example.HMS_backend.nurse.dto.*;
import com.example.HMS_backend.patient.entity.Patient;
import org.springframework.stereotype.Component;

@Component
public class NurseMapper {

    // 🔹 Doctor → DoctorOption DTO
    public DoctorOption toDoctorOption(User user) {
        return DoctorOption.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .build();
    }

    // 🔹 Encounter + Patient → DoctorPatientItem
    public DoctorPatientItem toDoctorPatientItem(Encounter encounter, Patient patient) {
        DoctorPatientItem.DoctorPatientItemBuilder builder = DoctorPatientItem.builder()
                .encounterId(encounter.getId())
                .encounterNumber(encounter.getEncounterNumber())
                .patientId(encounter.getPatientId())
                .encounterStatus(encounter.getStatus())
                .visitType(encounter.getVisitType())
                .priority(encounter.getPriority())
                .visitDate(encounter.getVisitDate())
                .checkinTime(encounter.getCheckinTime())
                .notes(encounter.getNotes())
                .roomNumber(encounter.getRoomNumber());

        if (patient != null) {
            builder.patientName(patient.getFirstName() + " " + patient.getLastName());
            builder.patientUhid(patient.getUhid());
            builder.gender(patient.getGender());
            builder.phone(patient.getPhone());
        }

        return builder.build();
    }

    // 🔹 Base Encounter → PatientCaseTimelineBuilder
    public PatientCaseTimeline toPatientCaseBase(Encounter encounter) {
        return PatientCaseTimeline.builder()
                .encounterId(encounter.getId())
                .encounterNumber(encounter.getEncounterNumber())
                .encounterStatus(encounter.getStatus() != null ? encounter.getStatus().toString() : null)
                .visitType(encounter.getVisitType() != null ? encounter.getVisitType().toString() : null)
                .priority(encounter.getPriority() != null ? encounter.getPriority().toString() : null)
                .visitDate(encounter.getVisitDate() != null ? encounter.getVisitDate().toString() : null)
                .checkinTime(encounter.getCheckinTime() != null ? encounter.getCheckinTime().toString() : null)
                .encounterNotes(encounter.getNotes())
                .roomNumber(encounter.getRoomNumber())
                .patientId(encounter.getPatientId())
                .doctorId(encounter.getDoctorId())
                .build();
    }

    // 🔹 Add Patient Details
    public void mapPatientDetails(PatientCaseTimeline builder, Patient patient) {
        if (patient == null) return;

        builder.setPatientName(patient.getFirstName() + " " + patient.getLastName());
        builder.setPatientUhid(patient.getUhid());
        builder.setGender(patient.getGender());
        builder.setDob(patient.getDob() != null ? patient.getDob().toString() : null);
        builder.setPhone(patient.getPhone());
        builder.setBloodGroup(patient.getBloodGroup());
    }

    // 🔹 Add Doctor Details
    public void mapDoctorDetails(PatientCaseTimeline builder, User doctor) {
        if (doctor != null) {
            builder.setDoctorName(doctor.getUsername());
        }
    }

    // 🔹 Add Consultation Details
    public void mapConsultationDetails(PatientCaseTimeline builder,
                                       Consultation consultation) {
        if (consultation == null) return;

        builder.setConsultationId(consultation.getId());
        builder.setSymptoms(consultation.getSymptoms());
        builder.setDiagnosis(consultation.getDiagnosis());
        builder.setPrescription(consultation.getPrescription());
        builder.setDoctorNotes(consultation.getDoctorNotes());
        builder.setFollowupDate(consultation.getFollowupDate() != null ? consultation.getFollowupDate().toString() : null);
        builder.setTestsRequested(consultation.getTestsRequested());
        builder.setConsultationCreatedAt(consultation.getCreatedAt() != null ? consultation.getCreatedAt().toString() : null);
    }

    // 🔹 Dashboard Stats Mapping
    public NurseDashboardStats toDashboardStats(
            long activeDoctors,
            long activeEncounters,
            long waitingPatients,
            long inConsultationPatients,
            long completedToday,
            long myPendingBedRequests,
            long totalPendingBedRequests,
            long totalEncounters,
            long totalPatients,
            long totalConsultations,
            long totalDoctors,
            long todayEncounters,
            long todayConsultations,
            long totalBedRequests,
            long myTotalBedRequests
    ) {
        return NurseDashboardStats.builder()
                .totalActiveDoctors(activeDoctors)
                .totalActiveEncounters(activeEncounters)
                .waitingPatients(waitingPatients)
                .inConsultationPatients(inConsultationPatients)
                .completedToday(completedToday)
                .myPendingBedRequests(myPendingBedRequests)
                .totalPendingBedRequests(totalPendingBedRequests)
                .totalEncounters(totalEncounters)
                .totalPatients(totalPatients)
                .totalConsultations(totalConsultations)
                .totalDoctors(totalDoctors)
                .todayEncounters(todayEncounters)
                .todayConsultations(todayConsultations)
                .totalBedRequests(totalBedRequests)
                .myTotalBedRequests(myTotalBedRequests)
                .build();
    }
}