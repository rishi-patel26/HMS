package com.example.HMS_backend.episode.repository;

import com.example.HMS_backend.episode.entity.Episode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EpisodeRepository extends JpaRepository<Episode, Long> {

    List<Episode> findByPatientIdOrderByStartDateDesc(Long patientId);

    long countByStatus(String status);

    List<Episode> findByPatientIdInOrderByStartDateDesc(List<Long> patientIds);
}
