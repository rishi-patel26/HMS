package com.example.HMS_backend.servicecatalog.mapper;

import com.example.HMS_backend.servicecatalog.dto.ServiceRequest;
import com.example.HMS_backend.servicecatalog.dto.ServiceResponse;
import com.example.HMS_backend.servicecatalog.entity.ServiceCatalog;
import org.springframework.stereotype.Component;

@Component
public class ServiceMapper {

    public ServiceCatalog toEntity(ServiceRequest request) {
        return ServiceCatalog.builder()
                .name(request.getName())
                .price(request.getPrice())
                .description(request.getDescription())
                .category(request.getCategory())
                .build();
    }

    public ServiceResponse toResponse(ServiceCatalog entity) {
        return ServiceResponse.builder()
                .id(entity.getId())
                .name(entity.getName())
                .price(entity.getPrice())
                .description(entity.getDescription())
                .category(entity.getCategory())
                .active(entity.getActive())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
