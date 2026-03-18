package com.example.HMS_backend.billing.repository;

import com.example.HMS_backend.billing.entity.Bill;
import com.example.HMS_backend.billing.enums.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface BillRepository extends JpaRepository<Bill, Long> {

    Optional<Bill> findByEncounterId(Long encounterId);

    List<Bill> findByCreatedAtBetweenOrderByCreatedAtDesc(LocalDateTime start, LocalDateTime end);

    List<Bill> findByPaymentStatusInOrderByCreatedAtDesc(List<PaymentStatus> statuses);

    @Query("SELECT COALESCE(SUM(b.paidAmount), 0) FROM Bill b WHERE b.createdAt BETWEEN :start AND :end")
    BigDecimal sumPaidAmountBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    long countByCreatedAtBetween(LocalDateTime start, LocalDateTime end);

    long countByPaymentStatusIn(List<PaymentStatus> statuses);

    @Query("SELECT CAST(b.createdAt AS date) AS day, COALESCE(SUM(b.paidAmount), 0) FROM Bill b " +
           "WHERE b.createdAt BETWEEN :start AND :end GROUP BY CAST(b.createdAt AS date) ORDER BY day")
    List<Object[]> sumRevenueByDayBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
}
