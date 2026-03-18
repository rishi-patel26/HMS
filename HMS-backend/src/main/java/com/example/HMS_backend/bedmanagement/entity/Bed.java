package com.example.HMS_backend.bedmanagement.entity;

import com.example.HMS_backend.bedmanagement.enums.BedStatus;
import com.example.HMS_backend.bedmanagement.enums.BedType;
import com.example.HMS_backend.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
        name = "beds",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_bed_number_per_ward", columnNames = {"ward_id", "bed_number"})
        }
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Bed extends BaseEntity {

    @Column(name = "bed_number", nullable = false, length = 50)
    private String bedNumber;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ward_id", nullable = false)
    private Ward ward;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private BedType bedType;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(nullable = false, length = 20)
    private BedStatus status = BedStatus.AVAILABLE;
}
