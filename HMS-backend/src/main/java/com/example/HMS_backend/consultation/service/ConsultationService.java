package com.example.HMS_backend.consultation.service;

import com.example.HMS_backend.consultation.dto.ConsultationRequest;
import com.example.HMS_backend.consultation.dto.ConsultationResponse;
import com.example.HMS_backend.consultation.entity.Consultation;
import com.example.HMS_backend.consultation.mapper.ConsultationMapper;
import com.example.HMS_backend.consultation.repository.ConsultationRepository;
import com.example.HMS_backend.encounter.entity.Encounter;
import com.example.HMS_backend.encounter.enums.EncounterStatus;
import com.example.HMS_backend.encounter.repository.EncounterRepository;
import com.example.HMS_backend.exception.ResourceNotFoundException;
import com.example.HMS_backend.patient.entity.Patient;
import com.example.HMS_backend.patient.repository.PatientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ConsultationService {

    private final ConsultationRepository consultationRepository;
    private final ConsultationMapper consultationMapper;
    private final EncounterRepository encounterRepository;
    private final PatientRepository patientRepository;

    @Transactional
    public ConsultationResponse createConsultation(ConsultationRequest request) {
        Encounter encounter = encounterRepository.findById(request.getEncounterId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Encounter not found with id: " + request.getEncounterId()));

        // Move encounter to IN_CONSULTATION if still WAITING
        if (encounter.getStatus() == EncounterStatus.WAITING) {
            encounter.setStatus(EncounterStatus.IN_CONSULTATION);
            encounterRepository.save(encounter);
        }

        Consultation consultation = consultationMapper.toEntity(request);
        Consultation saved = consultationRepository.save(consultation);
        return consultationMapper.toResponse(saved);
    }

    public ConsultationResponse getConsultationById(Long id) {
        Consultation consultation = consultationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Consultation not found with id: " + id));
        return consultationMapper.toResponse(consultation);
    }

    public ConsultationResponse getConsultationByEncounter(Long encounterId) {
        Consultation consultation = consultationRepository.findByEncounterId(encounterId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Consultation not found for encounter: " + encounterId));
        return consultationMapper.toResponse(consultation);
    }

    @Transactional
    public ConsultationResponse updateConsultation(Long id, ConsultationRequest request) {
        Consultation consultation = consultationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Consultation not found with id: " + id));

        consultation.setSymptoms(request.getSymptoms());
        consultation.setDiagnosis(request.getDiagnosis());
        consultation.setPrescription(request.getPrescription());
        consultation.setDoctorNotes(request.getDoctorNotes());
        consultation.setFollowupDate(request.getFollowupDate());
        consultation.setTestsRequested(request.getTestsRequested());

        Consultation saved = consultationRepository.save(consultation);
        return consultationMapper.toResponse(saved);
    }

    @Transactional
    public ConsultationResponse completeConsultation(Long id) {
        Consultation consultation = consultationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Consultation not found with id: " + id));

        // Mark the encounter as COMPLETED
        Encounter encounter = encounterRepository.findById(consultation.getEncounterId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Encounter not found with id: " + consultation.getEncounterId()));
        encounter.setStatus(EncounterStatus.COMPLETED);
        encounterRepository.save(encounter);

        return consultationMapper.toResponse(consultation);
    }

    public List<ConsultationResponse> getConsultationsByDoctor(String doctorUsername) {
        return consultationRepository.findByCreatedByOrderByCreatedAtDesc(doctorUsername).stream()
                .map(consultationMapper::toResponse)
                .toList();
    }

    public List<ConsultationResponse> getTodayConsultations() {
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime endOfDay = startOfDay.plusDays(1);
        return consultationRepository.findByCreatedAtBetweenOrderByCreatedAtDesc(startOfDay, endOfDay).stream()
                .map(consultationMapper::toResponse)
                .toList();
    }

    public List<ConsultationResponse> searchConsultations(String patientName, Long patientId) {
        List<Consultation> all = consultationRepository.findAll();

        return all.stream()
                .filter(c -> {
                    if (patientId != null) {
                        return encounterRepository.findById(c.getEncounterId())
                                .map(e -> e.getPatientId().equals(patientId))
                                .orElse(false);
                    }
                    if (patientName != null && !patientName.isBlank()) {
                        String query = patientName.toLowerCase();
                        return encounterRepository.findById(c.getEncounterId())
                                .flatMap(e -> patientRepository.findById(e.getPatientId()))
                                .map(p -> (p.getFirstName() + " " + p.getLastName()).toLowerCase().contains(query)
                                        || (p.getUhid() != null && p.getUhid().toLowerCase().contains(query)))
                                .orElse(false);
                    }
                    return true;
                })
                .sorted((a, b) -> {
                    if (b.getCreatedAt() == null) return -1;
                    if (a.getCreatedAt() == null) return 1;
                    return b.getCreatedAt().compareTo(a.getCreatedAt());
                })
                .map(consultationMapper::toResponse)
                .toList();
    }
}
