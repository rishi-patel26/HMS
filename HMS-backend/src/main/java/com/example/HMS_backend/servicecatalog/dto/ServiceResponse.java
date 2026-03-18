package com.example.HMS_backend.servicecatalog.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServiceResponse {

    private Long id;
    private String name;
    private BigDecimal price;
    private String description;
    private String category;
    private Boolean active;
    private LocalDateTime createdAt;
}
