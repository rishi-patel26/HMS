
package com.example.HMS_backend.bedmanagement.repository;

import com.example.HMS_backend.bedmanagement.entity.Bed;
import com.example.HMS_backend.bedmanagement.enums.BedStatus;
import com.example.HMS_backend.bedmanagement.enums.BedType;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface BedRepository extends JpaRepository<Bed, Long> {

    @Query("select b from Bed b join fetch b.ward w where b.status = :status and (:bedType is null or b.bedType = :bedType) and (:wardId is null or w.id = :wardId) order by w.name asc, b.bedNumber asc")
    List<Bed> findAvailableBeds(@Param("status") BedStatus status,
                                @Param("bedType") BedType bedType,
                                @Param("wardId") Long wardId);

    @Query("select b from Bed b join fetch b.ward w where w.id = :wardId order by b.bedNumber asc")
    List<Bed> findByWardIdWithWard(@Param("wardId") Long wardId);

    @Query("select b from Bed b join fetch b.ward")
    List<Bed> findAllWithWard();

    @Query("""
            select b from Bed b
            join fetch b.ward w
            where b.status = com.example.HMS_backend.bedmanagement.enums.BedStatus.AVAILABLE
                and b.bedType = :bedType
                and (:preferredWardId is null or w.id = :preferredWardId)
                and (:excludeBedId is null or b.id <> :excludeBedId)
            order by
                case when :preferredWardId is not null and w.id = :preferredWardId then 0 else 1 end,
                w.name asc,
                b.bedNumber asc
            """)
    List<Bed> findAssignableBeds(@Param("bedType") BedType bedType,
                                 @Param("preferredWardId") Long preferredWardId,
                                 @Param("excludeBedId") Long excludeBedId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select b from Bed b join fetch b.ward where b.id = :id")
    Optional<Bed> findByIdForUpdate(@Param("id") Long id);
}
