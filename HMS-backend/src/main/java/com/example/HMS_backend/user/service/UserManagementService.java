package com.example.HMS_backend.user.service;

import com.example.HMS_backend.entity.User;
import com.example.HMS_backend.exception.DuplicateResourceException;
import com.example.HMS_backend.exception.ResourceNotFoundException;
import com.example.HMS_backend.notification.enums.NotificationType;
import com.example.HMS_backend.notification.service.EmailService;
import com.example.HMS_backend.notification.service.NotificationService;
import com.example.HMS_backend.repository.UserRepository;
import com.example.HMS_backend.search.SearchResult;
import com.example.HMS_backend.search.SmartSearchService;
import com.example.HMS_backend.security.enums.Role;
import com.example.HMS_backend.user.dto.UserCreateRequest;
import com.example.HMS_backend.user.dto.UserResponse;
import com.example.HMS_backend.user.dto.UserUpdateRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.function.Function;

@Service
@RequiredArgsConstructor
public class UserManagementService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final NotificationService notificationService;
    private final EmailService emailService;
    private final SmartSearchService smartSearchService;

    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    public List<UserResponse> getDoctors() {
        return userRepository.findByRole(Role.DOCTOR).stream()
                .filter(User::isEnabled)
                .map(this::toResponse)
                .toList();
    }

    public UserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        return toResponse(user);
    }

    @Transactional
    public UserResponse createUser(UserCreateRequest request) {
        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            throw new DuplicateResourceException("Username already exists: " + request.getUsername());
        }
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new DuplicateResourceException("Email already exists: " + request.getEmail());
        }

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.valueOf(request.getRole()))
                .enabled(true)
                .build();

        User saved = userRepository.save(user);
        
        // Send welcome email with credentials
        emailService.sendWelcomeEmail(
            saved.getEmail(),
            saved.getUsername(),
            request.getPassword(), // Send plain password in email
            saved.getRole().name()
        );
        
        // Send in-app notification to the new user
        notificationService.notifyUser(
            String.format("Welcome to HMS! Your account has been created with role: %s", saved.getRole().name()),
            NotificationType.GENERAL,
            saved.getUsername()
        );
        
        return toResponse(saved);
    }

    @Transactional
    public UserResponse updateUser(Long id, UserUpdateRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        if (request.getEmail() != null && !request.getEmail().equals(user.getEmail())) {
            if (userRepository.findByEmail(request.getEmail()).isPresent()) {
                throw new DuplicateResourceException("Email already exists: " + request.getEmail());
            }
            user.setEmail(request.getEmail());
        }
        if (request.getRole() != null) {
            user.setRole(Role.valueOf(request.getRole()));
        }
        if (request.getEnabled() != null) {
            user.setEnabled(request.getEnabled());
        }
        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        User saved = userRepository.save(user);
        return toResponse(saved);
    }

    @Transactional
    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        user.setEnabled(false);
        userRepository.save(user);
    }

    public List<UserResponse> searchUsers(String query) {
        if (query == null || query.trim().isEmpty()) {
            return getAllUsers();
        }

        List<User> allUsers = userRepository.findAll();

        Map<String, Function<User, String>> fieldExtractors = new LinkedHashMap<>();
        fieldExtractors.put("username", User::getUsername);
        fieldExtractors.put("email", User::getEmail);
        fieldExtractors.put("role", user -> user.getRole().name());

        List<SearchResult<User>> results = smartSearchService.multiFieldSearch(
                query,
                allUsers,
                fieldExtractors
        );

        return results.stream()
                .map(SearchResult::getData)
                .map(this::toResponse)
                .toList();
    }

    private UserResponse toResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole().name())
                .enabled(user.isEnabled())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
