package com.example.HMS_backend.bedmanagement.repository;

import com.example.HMS_backend.bedmanagement.entity.Ward;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;

public interface WardRepository extends JpaRepository<Ward, Long> {

    List<Ward> findAllByOrderByNameAsc();

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select w from Ward w where w.id = :id")
    Optional<Ward> findByIdForUpdate(@Param("id") Long id);
}
