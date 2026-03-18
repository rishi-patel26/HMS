package com.example.HMS_backend.patient.service;

import com.example.HMS_backend.exception.DuplicateResourceException;
import com.example.HMS_backend.exception.ResourceNotFoundException;
import com.example.HMS_backend.patient.dto.PatientRequest;
import com.example.HMS_backend.patient.dto.PatientResponse;
import com.example.HMS_backend.patient.entity.Patient;
import com.example.HMS_backend.patient.mapper.PatientMapper;
import com.example.HMS_backend.patient.repository.PatientRepository;
import com.example.HMS_backend.util.UhidGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PatientService {

    private final PatientRepository patientRepository;
    private final PatientMapper patientMapper;
    private final UhidGenerator uhidGenerator;

    @Transactional
    public PatientResponse createPatient(PatientRequest request) {

        if (patientRepository.findByPhone(request.getPhone()).isPresent()) {
            throw new DuplicateResourceException(
                    "A patient with phone number " + request.getPhone() + " already exists"
            );
        }

        Patient patient = patientMapper.toEntity(request);
        patient.setUhid(uhidGenerator.generateUhid());

        Patient saved = patientRepository.save(patient);

        return patientMapper.toResponse(saved);
    }

    public PatientResponse getPatientById(Long id) {

        Patient patient = patientRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Patient not found with id: " + id));

        return patientMapper.toResponse(patient);
    }

    public List<PatientResponse> searchPatients(String query) {

        return patientRepository.searchPatients(query)
                .stream()
                .map(patientMapper::toResponse)
                .toList();
    }

    public List<PatientResponse> getRecentPatients() {

        return patientRepository.findTop50ByOrderByCreatedAtDesc()
                .stream()
                .map(patientMapper::toResponse)
                .toList();
    }

    @Transactional
    public PatientResponse updatePatient(Long id, PatientRequest request) {

        Patient patient = patientRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Patient not found with id: " + id));

        // ✅ mapper handles field updates now
        patientMapper.updateEntity(patient, request);

        Patient saved = patientRepository.save(patient);

        return patientMapper.toResponse(saved);
    }

    public long countPatients() {
        return patientRepository.count();
    }

    @Transactional
    public void deletePatient(Long id) {

        patientRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Patient not found with id: " + id));

        patientRepository.deleteById(id);
    }
}