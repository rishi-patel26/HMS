package com.example.HMS_backend.episode.service;

import com.example.HMS_backend.appointment.repository.AppointmentRepository;
import com.example.HMS_backend.entity.User;
import com.example.HMS_backend.episode.dto.EpisodeRequest;
import com.example.HMS_backend.episode.dto.EpisodeResponse;
import com.example.HMS_backend.episode.entity.Episode;
import com.example.HMS_backend.episode.mapper.EpisodeMapper;
import com.example.HMS_backend.episode.repository.EpisodeRepository;
import com.example.HMS_backend.exception.ResourceNotFoundException;
import com.example.HMS_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class EpisodeService {

    private final EpisodeRepository episodeRepository;
    private final EpisodeMapper episodeMapper;
    private final AppointmentRepository appointmentRepository;
    private final UserRepository userRepository;

    @Transactional
    public EpisodeResponse createEpisode(EpisodeRequest request) {
        Episode episode = episodeMapper.toEntity(request);
        Episode saved = episodeRepository.save(episode);
        return episodeMapper.toResponse(saved);
    }

    public List<EpisodeResponse> getEpisodes(Long patientId, String status, LocalDate startDate, LocalDate endDate) {
        Stream<Episode> stream = episodeRepository.findAll().stream();

        if (patientId != null) {
            stream = stream.filter(e -> e.getPatientId().equals(patientId));
        }
        if (status != null && !status.isBlank()) {
            stream = stream.filter(e -> e.getStatus().equalsIgnoreCase(status));
        }
        if (startDate != null) {
            stream = stream.filter(e -> !e.getStartDate().isBefore(startDate));
        }
        if (endDate != null) {
            stream = stream.filter(e -> e.getEndDate() != null && !e.getEndDate().isAfter(endDate));
        }

        return stream.map(episodeMapper::toResponse).toList();
    }

    public List<EpisodeResponse> getEpisodesByPatient(Long patientId) {
        return episodeRepository.findByPatientIdOrderByStartDateDesc(patientId).stream()
                .map(episodeMapper::toResponse)
                .toList();
    }

    public EpisodeResponse getEpisodeById(Long id) {
        Episode episode = episodeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Episode not found with id: " + id));
        return episodeMapper.toResponse(episode);
    }

    public List<EpisodeResponse> getDoctorEpisodes(String doctorUsername) {
        User doctor = userRepository.findByUsername(doctorUsername)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found: " + doctorUsername));
        List<Long> patientIds = appointmentRepository.findByDoctorIdOrderByAppointmentTimeDesc(doctor.getId())
                .stream()
                .map(a -> a.getPatientId())
                .distinct()
                .toList();
        if (patientIds.isEmpty()) return List.of();
        return episodeRepository.findByPatientIdInOrderByStartDateDesc(patientIds).stream()
                .map(episodeMapper::toResponse)
                .toList();
    }

    @Transactional
    public EpisodeResponse closeEpisode(Long id) {
        Episode episode = episodeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Episode not found with id: " + id));
        episode.setStatus("CLOSED");
        episode.setEndDate(LocalDate.now());
        Episode saved = episodeRepository.save(episode);
        return episodeMapper.toResponse(saved);
    }

    @Transactional
    public EpisodeResponse updateEpisode(Long id, EpisodeRequest request) {
        Episode episode = episodeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Episode not found with id: " + id));
        episode.setEpisodeType(request.getEpisodeType());
        episode.setDescription(request.getDescription());
        if (request.getSeverity() != null) episode.setSeverity(request.getSeverity());
        if (request.getNotes() != null) episode.setNotes(request.getNotes());
        if (request.getDiagnosisSummary() != null) episode.setDiagnosisSummary(request.getDiagnosisSummary());
        Episode saved = episodeRepository.save(episode);
        return episodeMapper.toResponse(saved);
    }

    @Transactional
    public void deleteEpisode(Long id) {
        episodeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Episode not found with id: " + id));
        episodeRepository.deleteById(id);
    }
}
