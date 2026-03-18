package com.example.HMS_backend.billing.entity;

import com.example.HMS_backend.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "bill_items")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BillItem extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bill_id", nullable = false)
    private Bill bill;

    @Column(nullable = false)
    private Long serviceId;

    @Column(nullable = false, length = 255)
    private String serviceName;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Builder.Default
    @Column(nullable = false)
    private Integer quantity = 1;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal subtotal;
}
