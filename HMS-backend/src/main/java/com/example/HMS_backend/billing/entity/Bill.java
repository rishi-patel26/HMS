package com.example.HMS_backend.billing.entity;

import com.example.HMS_backend.billing.enums.PaymentStatus;
import com.example.HMS_backend.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "bills")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Bill extends BaseEntity {

    @Column(nullable = false, unique = true)
    private String billNumber;

    @Column(nullable = false)
    private Long encounterId;

    @Builder.Default
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal totalAmount = BigDecimal.ZERO;

    @Builder.Default
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal paidAmount = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(nullable = false)
    private PaymentStatus paymentStatus = PaymentStatus.PENDING;

    private String paymentMethod;

    @Builder.Default
    @OneToMany(mappedBy = "bill", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<BillItem> items = new ArrayList<>();
}
