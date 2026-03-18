package com.example.HMS_backend.config;

import com.example.HMS_backend.bedmanagement.entity.Bed;
import com.example.HMS_backend.bedmanagement.entity.Ward;
import com.example.HMS_backend.bedmanagement.enums.BedStatus;
import com.example.HMS_backend.bedmanagement.enums.BedType;
import com.example.HMS_backend.bedmanagement.enums.WardType;
import com.example.HMS_backend.bedmanagement.repository.BedRepository;
import com.example.HMS_backend.bedmanagement.repository.WardRepository;
import com.example.HMS_backend.entity.User;
import com.example.HMS_backend.repository.UserRepository;
import com.example.HMS_backend.security.enums.Role;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final WardRepository wardRepository;
    private final BedRepository bedRepository;

    @Override
    public void run(String... args) {
        createUserIfNotExists("admin", "admin@hospital.com", "admin123", Role.ADMIN);
        createUserIfNotExists("frontdesk", "frontdesk@hospital.com", "frontdesk123", Role.FRONTDESK);
        createUserIfNotExists("doctor", "doctor@hospital.com", "doctor123", Role.DOCTOR);
        createUserIfNotExists("nurse", "nurse@hospital.com", "nurse123", Role.NURSE);
        createUserIfNotExists("bedmanager", "bedmanager@hospital.com", "bedmanager123", Role.BED_MANAGER);

        seedBedManagementMasterData();
    }

    private void createUserIfNotExists(String username, String email, String password, Role role) {
        if (userRepository.findByUsername(username).isEmpty()) {
            User user = User.builder()
                    .username(username)
                    .email(email)
                    .password(passwordEncoder.encode(password))
                    .role(role)
                    .enabled(true)
                    .build();
            userRepository.save(user);
            System.out.println("Default user created - Username: " + username + ", Role: " + role.name());
        }
    }

    private void seedBedManagementMasterData() {
        Map<String, WardSeedConfig> wardSeeds = new LinkedHashMap<>();
        wardSeeds.put("ICU", new WardSeedConfig(WardType.ICU, BedType.ICU, 10, "ICU"));
        wardSeeds.put("GENERAL", new WardSeedConfig(WardType.GENERAL, BedType.GENERAL, 30, "GENERAL"));
        wardSeeds.put("PRIVATE", new WardSeedConfig(WardType.PRIVATE, BedType.PRIVATE, 10, "PRIVATE"));

        List<Ward> existingWards = wardRepository.findAll();
        Map<String, Ward> wardByName = new LinkedHashMap<>();
        for (Ward ward : existingWards) {
            wardByName.put(ward.getName(), ward);
        }

        for (Map.Entry<String, WardSeedConfig> entry : wardSeeds.entrySet()) {
            String wardName = entry.getKey();
            WardSeedConfig config = entry.getValue();

            Ward ward = wardByName.get(wardName);
            if (ward == null) {
                ward = Ward.builder()
                        .name(wardName)
                        .type(config.wardType())
                        .capacity(config.capacity())
                        .occupiedBeds(0)
                        .active(true)
                        .build();
                ward = wardRepository.save(ward);
            }

            seedBedsForWard(ward, config);
        }
    }

    private void seedBedsForWard(Ward ward, WardSeedConfig config) {
        List<Bed> existingBeds = bedRepository.findByWardIdWithWard(ward.getId());
        Set<String> existingBedNumbers = existingBeds.stream()
                .map(Bed::getBedNumber)
                .collect(Collectors.toSet());

        for (int i = 1; i <= config.capacity(); i++) {
            String bedNumber = config.bedPrefix() + "-" + i;
            if (existingBedNumbers.contains(bedNumber)) {
                continue;
            }

            Bed bed = Bed.builder()
                    .bedNumber(bedNumber)
                    .ward(ward)
                    .bedType(config.bedType())
                    .status(BedStatus.AVAILABLE)
                    .build();
            bedRepository.save(bed);
        }
    }

    private record WardSeedConfig(WardType wardType, BedType bedType, int capacity, String bedPrefix) {
    }
}
