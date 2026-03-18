package com.example.HMS_backend.bedmanagement.repository;

import com.example.HMS_backend.bedmanagement.entity.BedEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BedEventRepository extends JpaRepository<BedEvent, Long> {

    List<BedEvent> findByEncounterIdOrderByTimestampAsc(Long encounterId);
}
