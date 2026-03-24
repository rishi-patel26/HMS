package com.example.HMS_backend.patient.entity;

import com.example.HMS_backend.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "patients")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Patient extends BaseEntity {

    @Column(nullable = false, unique = true)
    private String uhid;

    @Column(nullable = false)
    private String firstName;

    @Column(nullable = false)
    private String lastName;

    @Column(nullable = false)
    private String gender;

    private LocalDate dob;

    @Column(nullable = false)
    private String phone;

    private String email;

    private String address;

    @Column(name = "blood_group", length = 5)
    private String bloodGroup;

    @Column(name = "emergency_contact", length = 20)
    private String emergencyContact;


    // Phonetic search fields
    @Column(name = "first_name_phonetic")
    private String firstNamePhonetic;

    @Column(name = "last_name_phonetic")
    private String lastNamePhonetic;

    @Column(name = "full_name_phonetic")
    private String fullNamePhonetic;


}
