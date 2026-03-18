package com.example.HMS_backend.bedmanagement.entity;

import com.example.HMS_backend.bedmanagement.enums.WardType;
import com.example.HMS_backend.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "wards")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Ward extends BaseEntity {

    @Column(nullable = false, unique = true, length = 100)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private WardType type;

    @Column(nullable = false)
    private Integer capacity;

    @Builder.Default
    @Column(nullable = false)
    private Integer occupiedBeds = 0;

    @Builder.Default
    @Column(nullable = false)
    private Boolean active = true;
}
