package com.example.HMS_backend.billing.dto;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BillRequest {

    private String paymentMethod;
}
