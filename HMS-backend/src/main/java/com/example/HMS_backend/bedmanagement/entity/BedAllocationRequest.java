package com.example.HMS_backend.bedmanagement.entity;

import com.example.HMS_backend.bedmanagement.enums.BedAllocationPriority;
import com.example.HMS_backend.bedmanagement.enums.BedAllocationRequestStatus;
import com.example.HMS_backend.bedmanagement.enums.BedType;
import com.example.HMS_backend.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "bed_allocation_requests")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BedAllocationRequest extends BaseEntity {

    @Column(nullable = false)
    private Long encounterId;

    @Column(nullable = false)
    private Long patientId;

    @Column(nullable = false)
    private Long requestedBy;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private BedType requiredBedType;

    private Long preferredWardId;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(nullable = false, length = 20)
    private BedAllocationPriority priority = BedAllocationPriority.NORMAL;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(nullable = false, length = 20)
    private BedAllocationRequestStatus status = BedAllocationRequestStatus.REQUESTED;

    @Column(length = 1000)
    private String notes;
}
