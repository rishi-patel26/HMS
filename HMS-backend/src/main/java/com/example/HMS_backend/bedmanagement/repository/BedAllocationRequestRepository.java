package com.example.HMS_backend.bedmanagement.repository;

import com.example.HMS_backend.bedmanagement.entity.BedAllocationRequest;
import com.example.HMS_backend.bedmanagement.enums.BedAllocationRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface BedAllocationRequestRepository extends JpaRepository<BedAllocationRequest, Long> {

    List<BedAllocationRequest> findByEncounterIdOrderByCreatedAtDesc(Long encounterId);

    List<BedAllocationRequest> findByRequestedByOrderByCreatedAtDesc(Long requestedBy);

    List<BedAllocationRequest> findByStatusOrderByCreatedAtAsc(BedAllocationRequestStatus status);

    List<BedAllocationRequest> findByStatusInOrderByCreatedAtAsc(Collection<BedAllocationRequestStatus> statuses);

    Optional<BedAllocationRequest> findTopByEncounterIdAndStatusInOrderByCreatedAtDesc(
            Long encounterId,
            Collection<BedAllocationRequestStatus> statuses
    );

    long countByStatusIn(Collection<BedAllocationRequestStatus> statuses);
}
