package com.example.HMS_backend.servicecatalog.service;

import com.example.HMS_backend.exception.ResourceNotFoundException;
import com.example.HMS_backend.search.SearchResult;
import com.example.HMS_backend.search.SmartSearchService;
import com.example.HMS_backend.servicecatalog.dto.ServiceRequest;
import com.example.HMS_backend.servicecatalog.dto.ServiceResponse;
import com.example.HMS_backend.servicecatalog.entity.ServiceCatalog;
import com.example.HMS_backend.servicecatalog.mapper.ServiceMapper;
import com.example.HMS_backend.servicecatalog.repository.ServiceCatalogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.function.Function;

@Service
@RequiredArgsConstructor
public class ServiceCatalogService {

    private final ServiceCatalogRepository serviceCatalogRepository;
    private final ServiceMapper serviceMapper;
    private final SmartSearchService smartSearchService;

    @Transactional
    public ServiceResponse createService(ServiceRequest request) {
        ServiceCatalog entity = serviceMapper.toEntity(request);
        ServiceCatalog saved = serviceCatalogRepository.save(entity);
        return serviceMapper.toResponse(saved);
    }

    public List<ServiceResponse> getAllServices() {
        return serviceCatalogRepository.findByActiveTrue().stream()
                .map(serviceMapper::toResponse)
                .toList();
    }

    @Transactional
    public ServiceResponse updateService(Long id, ServiceRequest request) {
        ServiceCatalog entity = serviceCatalogRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Service not found with id: " + id));
        entity.setName(request.getName());
        entity.setPrice(request.getPrice());
        entity.setDescription(request.getDescription());
        entity.setCategory(request.getCategory());
        ServiceCatalog saved = serviceCatalogRepository.save(entity);
        return serviceMapper.toResponse(saved);
    }

    @Transactional
    public void disableService(Long id) {
        ServiceCatalog entity = serviceCatalogRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Service not found with id: " + id));
        entity.setActive(false);
        serviceCatalogRepository.save(entity);
    }

    public List<ServiceResponse> searchServices(String query) {
        if (query == null || query.trim().isEmpty()) {
            return getAllServices();
        }

        List<ServiceCatalog> allServices = serviceCatalogRepository.findByActiveTrue();

        Map<String, Function<ServiceCatalog, String>> fieldExtractors = new LinkedHashMap<>();
        fieldExtractors.put("name", ServiceCatalog::getName);
        fieldExtractors.put("description", service -> service.getDescription() != null ? service.getDescription() : "");
        fieldExtractors.put("category", service -> service.getCategory() != null ? service.getCategory() : "");

        List<SearchResult<ServiceCatalog>> results = smartSearchService.multiFieldSearch(
                query,
                allServices,
                fieldExtractors
        );

        return results.stream()
                .map(SearchResult::getData)
                .map(serviceMapper::toResponse)
                .toList();
    }
}
