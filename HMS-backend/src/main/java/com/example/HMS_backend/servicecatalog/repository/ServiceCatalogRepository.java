package com.example.HMS_backend.servicecatalog.repository;

import com.example.HMS_backend.servicecatalog.entity.ServiceCatalog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ServiceCatalogRepository extends JpaRepository<ServiceCatalog, Long> {

    List<ServiceCatalog> findByActiveTrue();
}
