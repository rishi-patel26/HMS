package com.example.HMS_backend.bedmanagement.repository;

import com.example.HMS_backend.bedmanagement.entity.BedAssignment;
import com.example.HMS_backend.bedmanagement.enums.BedAssignmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface BedAssignmentRepository extends JpaRepository<BedAssignment, Long> {

    Optional<BedAssignment> findTopByEncounterIdAndStatusInOrderByAssignedAtDesc(
            Long encounterId,
            Collection<BedAssignmentStatus> statuses
    );

    List<BedAssignment> findByStatusInOrderByAssignedAtDesc(Collection<BedAssignmentStatus> statuses);

    List<BedAssignment> findAllByOrderByAssignedAtDesc();

        @Query("""
            select a from BedAssignment a
            where a.assignedAt <= :rangeEnd
              and (a.dischargedAt is null or a.dischargedAt >= :rangeStart)
            """)
        List<BedAssignment> findAssignmentsOverlappingRange(
            @Param("rangeStart") LocalDateTime rangeStart,
            @Param("rangeEnd") LocalDateTime rangeEnd
        );
}
