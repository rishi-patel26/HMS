package com.example.HMS_backend.nurse.dto;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DoctorOption {
    private Long id;
    private String username;
    private String email;
}
