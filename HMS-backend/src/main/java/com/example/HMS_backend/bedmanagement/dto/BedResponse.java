package com.example.HMS_backend.bedmanagement.dto;

import com.example.HMS_backend.bedmanagement.enums.BedStatus;
import com.example.HMS_backend.bedmanagement.enums.BedType;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class BedResponse {
    private Long id;
    private String bedNumber;
    private Long wardId;
    private String wardName;
    private BedType bedType;
    private BedStatus status;
}
