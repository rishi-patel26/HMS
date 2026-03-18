package com.example.HMS_backend.user.dto;

import jakarta.validation.constraints.Email;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserUpdateRequest {

    @Email(message = "Email must be valid")
    private String email;

    private String password;
    private String role;
    private Boolean enabled;
}
