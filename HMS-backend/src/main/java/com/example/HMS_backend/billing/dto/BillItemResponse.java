package com.example.HMS_backend.billing.dto;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BillItemResponse {

    private Long id;
    private Long serviceId;
    private String serviceName;
    private BigDecimal price;
    private Integer quantity;
    private BigDecimal subtotal;
}
