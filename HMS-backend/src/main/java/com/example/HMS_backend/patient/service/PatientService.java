package com.example.HMS_backend.patient.service;

import com.example.HMS_backend.exception.DuplicateResourceException;
import com.example.HMS_backend.exception.ResourceNotFoundException;
import com.example.HMS_backend.patient.dto.PatientRequest;
import com.example.HMS_backend.patient.dto.PatientResponse;
import com.example.HMS_backend.patient.entity.Patient;
import com.example.HMS_backend.patient.mapper.PatientMapper;
import com.example.HMS_backend.patient.repository.PatientRepository;
import com.example.HMS_backend.search.SearchResult;
import com.example.HMS_backend.search.SmartSearchService;
import com.example.HMS_backend.util.PhoneticSearchUtil;
import com.example.HMS_backend.util.UhidGenerator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PatientService {

    private final PatientRepository patientRepository;
    private final PatientMapper patientMapper;
    private final UhidGenerator uhidGenerator;
    private final PhoneticSearchUtil phoneticSearchUtil;
    private final SmartSearchService smartSearchService;

    @Transactional
    public PatientResponse createPatient(PatientRequest request) {
        if (patientRepository.findByPhone(request.getPhone()).isPresent()) {
            throw new DuplicateResourceException(
                    "A patient with phone number " + request.getPhone() + " already exists"
            );
        }

        Patient patient = patientMapper.toEntity(request);
        patient.setUhid(uhidGenerator.generateUhid());

        // Generate and store phonetic keys
        updatePhoneticKeys(patient);

        Patient saved = patientRepository.save(patient);
        return patientMapper.toResponse(saved);
    }

    public PatientResponse getPatientById(Long id) {
        Patient patient = patientRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Patient not found with id: " + id));
        return patientMapper.toResponse(patient);
    }

    /**
     * Smart search for patients using multi-tier strategy:
     * 1. DB filtering with LIKE and phonetic keys (prevents full table scan)
     * 2. In-memory ranking with exact, prefix, contains, phonetic, fuzzy
     * 3. Results sorted by relevance score
     */
    public List<PatientResponse> searchPatients(String query) {
        if (query == null || query.trim().isEmpty()) {
            return getRecentPatients();
        }

        log.info("Searching patients with query: '{}'", query);

        // Step 1: DB filtering - get candidates using LIKE and phonetic
        List<Patient> candidates = getCandidatesFromDatabase(query);
        
        if (candidates.isEmpty()) {
            log.debug("No candidates found in database for query: '{}'", query);
            return Collections.emptyList();
        }

        log.debug("Found {} candidates from database", candidates.size());

        // Step 2: Multi-field smart search with ranking
        Map<String, java.util.function.Function<Patient, String>> fieldExtractors = new LinkedHashMap<>();
        fieldExtractors.put("uhid", Patient::getUhid);
        fieldExtractors.put("phone", Patient::getPhone);
        fieldExtractors.put("firstName", Patient::getFirstName);
        fieldExtractors.put("lastName", Patient::getLastName);
        fieldExtractors.put("fullName", p -> p.getFirstName() + " " + p.getLastName());

        List<SearchResult<Patient>> results = smartSearchService.multiFieldSearch(
            query, 
            candidates, 
            fieldExtractors
        );

        log.info("Smart search returned {} results for query: '{}'", results.size(), query);

        // Step 3: Convert to response DTOs
        return results.stream()
                .map(result -> {
                    PatientResponse response = patientMapper.toResponse(result.getData());
                    log.debug("Match: {} - Score: {}, Type: {}, Field: {}", 
                        response.getFirstName() + " " + response.getLastName(),
                        result.getScore(),
                        result.getMatchType(),
                        result.getMatchedField());
                    return response;
                })
                .collect(Collectors.toList());
    }

    /**
     * Get candidates from database using LIKE and phonetic keys
     * This prevents full table scan
     */
    private List<Patient> getCandidatesFromDatabase(String query) {
        Set<Patient> candidates = new HashSet<>();

        // 1. LIKE search (exact and partial matches)
        List<Patient> likeMatches = patientRepository.searchPatients(query);
        candidates.addAll(likeMatches);

        // 2. Phonetic search
        String phoneticKey = phoneticSearchUtil.generatePhoneticKey(query);
        if (!phoneticKey.isEmpty()) {
            List<Patient> phoneticMatches = patientRepository.findByPhoneticKey(phoneticKey);
            candidates.addAll(phoneticMatches);
        }

        // 3. If query has multiple words, search each word
        String[] words = query.trim().split("\\s+");
        if (words.length > 1) {
            for (String word : words) {
                if (word.length() >= 2) { // Minimum 2 characters
                    candidates.addAll(patientRepository.searchPatients(word));
                    
                    String wordPhoneticKey = phoneticSearchUtil.generatePhoneticKey(word);
                    if (!wordPhoneticKey.isEmpty()) {
                        candidates.addAll(patientRepository.findByPhoneticKey(wordPhoneticKey));
                    }
                }
            }
        }

        return new ArrayList<>(candidates);
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

        patientMapper.updateEntity(patient, request);

        // Update phonetic keys if name changed
        updatePhoneticKeys(patient);

        Patient saved = patientRepository.save(patient);
        return patientMapper.toResponse(saved);
    }

    /**
     * Update phonetic keys for a patient
     */
    private void updatePhoneticKeys(Patient patient) {
        PhoneticSearchUtil.PhoneticKeys keys = phoneticSearchUtil.generateNamePhoneticKeys(
            patient.getFirstName(), 
            patient.getLastName()
        );
        
        patient.setFirstNamePhonetic(keys.firstNameKey);
        patient.setLastNamePhonetic(keys.lastNameKey);
        patient.setFullNamePhonetic(keys.fullNameKey);
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
