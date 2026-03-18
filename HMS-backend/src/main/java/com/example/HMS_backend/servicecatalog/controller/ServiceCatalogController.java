package com.example.HMS_backend.servicecatalog.controller;

import com.example.HMS_backend.servicecatalog.dto.ServiceRequest;
import com.example.HMS_backend.servicecatalog.dto.ServiceResponse;
import com.example.HMS_backend.servicecatalog.service.ServiceCatalogService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/services")
@RequiredArgsConstructor
public class ServiceCatalogController {

    private final ServiceCatalogService serviceCatalogService;

    @PostMapping
    public ResponseEntity<ServiceResponse> createService(@Valid @RequestBody ServiceRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(serviceCatalogService.createService(request));
    }

    @GetMapping
    public ResponseEntity<List<ServiceResponse>> getAllServices() {
        return ResponseEntity.ok(serviceCatalogService.getAllServices());
    }

    @PutMapping("/{id}")
    public ResponseEntity<ServiceResponse> updateService(@PathVariable Long id,
                                                         @Valid @RequestBody ServiceRequest request) {
        return ResponseEntity.ok(serviceCatalogService.updateService(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> disableService(@PathVariable Long id) {
        serviceCatalogService.disableService(id);
        return ResponseEntity.noContent().build();
    }
}
