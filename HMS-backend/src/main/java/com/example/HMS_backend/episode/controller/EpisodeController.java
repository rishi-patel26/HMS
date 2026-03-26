package com.example.HMS_backend.episode.controller;

import com.example.HMS_backend.episode.dto.EpisodeRequest;
import com.example.HMS_backend.episode.dto.EpisodeResponse;
import com.example.HMS_backend.episode.service.EpisodeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/episodes")
@RequiredArgsConstructor
public class EpisodeController {

    private final EpisodeService episodeService;

    @PostMapping
    @PreAuthorize("hasAnyRole('DOCTOR','ADMIN')")
    public ResponseEntity<EpisodeResponse> createEpisode(@Valid @RequestBody EpisodeRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(episodeService.createEpisode(request));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('DOCTOR','ADMIN')")
    public ResponseEntity<List<EpisodeResponse>> getAllEpisodes(
            @RequestParam(required = false) Long patientId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(episodeService.getEpisodes(patientId, status, startDate, endDate));
    }

    @GetMapping("/patient/{patientId}")
    @PreAuthorize("hasAnyRole('DOCTOR','ADMIN','FRONTDESK')")
    public ResponseEntity<List<EpisodeResponse>> getEpisodesByPatient(@PathVariable Long patientId) {
        return ResponseEntity.ok(episodeService.getEpisodesByPatient(patientId));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('DOCTOR','ADMIN','FRONTDESK')")
    public ResponseEntity<EpisodeResponse> getEpisodeById(@PathVariable Long id) {
        return ResponseEntity.ok(episodeService.getEpisodeById(id));
    }

    @PutMapping("/{id}/close")
    @PreAuthorize("hasAnyRole('DOCTOR','ADMIN')")
    public ResponseEntity<EpisodeResponse> closeEpisode(@PathVariable Long id) {
        return ResponseEntity.ok(episodeService.closeEpisode(id));
    }

    @GetMapping("/doctor")
    @PreAuthorize("hasAnyRole('DOCTOR','ADMIN')")
    public ResponseEntity<List<EpisodeResponse>> getDoctorEpisodes(
            Authentication authentication) {
        return ResponseEntity.ok(episodeService.getDoctorEpisodes(authentication.getName()));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('DOCTOR','ADMIN')")
    public ResponseEntity<EpisodeResponse> updateEpisode(@PathVariable Long id,
            @Valid @RequestBody EpisodeRequest request) {
        return ResponseEntity.ok(episodeService.updateEpisode(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteEpisode(@PathVariable Long id) {
        episodeService.deleteEpisode(id);
        return ResponseEntity.noContent().build();
    }
}
