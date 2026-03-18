package com.example.HMS_backend.servicecatalog.entity;

import com.example.HMS_backend.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "service_catalog")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServiceCatalog extends BaseEntity {

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    private String description;

    @Builder.Default
    @Column(nullable = false)
    private Boolean active = true;

    @Column(length = 100)
    private String category;
}
