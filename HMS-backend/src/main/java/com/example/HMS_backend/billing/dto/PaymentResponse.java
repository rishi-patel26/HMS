package com.example.HMS_backend.billing.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentResponse {

    private Long id;
    private BigDecimal amount;
    private String paymentMethod;
    private String transactionReference;
    private LocalDateTime createdAt;
}
