package com.example.HMS_backend.billing.dto;

import com.example.HMS_backend.billing.enums.PaymentStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BillResponse {

    private Long id;
    private String billNumber;
    private Long encounterId;
    private String patientName;
    private String patientUhid;
    private Long patientId;
    private BigDecimal totalAmount;
    private BigDecimal paidAmount;
    private PaymentStatus paymentStatus;
    private String paymentMethod;
    private List<BillItemResponse> items;
    private List<PaymentResponse> payments;
    private LocalDateTime createdAt;
}
