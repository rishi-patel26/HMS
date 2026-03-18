package com.example.HMS_backend.billing.service;

import com.example.HMS_backend.billing.dto.BillItemRequest;
import com.example.HMS_backend.billing.dto.BillResponse;
import com.example.HMS_backend.billing.entity.Bill;
import com.example.HMS_backend.billing.entity.BillItem;
import com.example.HMS_backend.billing.enums.PaymentStatus;
import com.example.HMS_backend.billing.mapper.BillingMapper;
import com.example.HMS_backend.billing.repository.BillRepository;
import com.example.HMS_backend.encounter.entity.Encounter;
import com.example.HMS_backend.encounter.repository.EncounterRepository;
import com.example.HMS_backend.exception.ResourceNotFoundException;
import com.example.HMS_backend.servicecatalog.entity.ServiceCatalog;
import com.example.HMS_backend.servicecatalog.repository.ServiceCatalogRepository;
import com.example.HMS_backend.util.BillNumberGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BillingService {

    private final BillRepository billRepository;
    private final ServiceCatalogRepository serviceCatalogRepository;
    private final EncounterRepository encounterRepository;
    private final BillingMapper billingMapper;
    private final BillNumberGenerator billNumberGenerator;

    @Transactional
    public BillResponse createBill(Long encounterId) {
        // Validate encounter exists before creating bill
        encounterRepository.findById(encounterId)
                .orElseThrow(() -> new ResourceNotFoundException("Encounter not found with id: " + encounterId));

        Bill bill = Bill.builder()
                .billNumber(billNumberGenerator.generateBillNumber())
                .encounterId(encounterId)
                .build();
        Bill saved = billRepository.save(bill);
        return billingMapper.toResponse(saved);
    }

    @Transactional
    public BillResponse addBillItem(Long billId, BillItemRequest request) {
        Bill bill = billRepository.findById(billId)
                .orElseThrow(() -> new ResourceNotFoundException("Bill not found with id: " + billId));

        ServiceCatalog service = serviceCatalogRepository.findById(request.getServiceId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Service not found with id: " + request.getServiceId()));

        BigDecimal subtotal = service.getPrice().multiply(BigDecimal.valueOf(request.getQuantity()));

        BillItem item = BillItem.builder()
                .bill(bill)
                .serviceId(request.getServiceId())
                .serviceName(service.getName())
                .price(service.getPrice())
                .quantity(request.getQuantity())
                .subtotal(subtotal)
                .build();

        bill.getItems().add(item);
        bill.setTotalAmount(bill.getTotalAmount().add(subtotal));

        Bill saved = billRepository.save(bill);
        return billingMapper.toResponse(saved);
    }

    public BillResponse getBill(Long billId) {
        Bill bill = billRepository.findById(billId)
                .orElseThrow(() -> new ResourceNotFoundException("Bill not found with id: " + billId));
        return billingMapper.toResponse(bill);
    }

    @Transactional
    public BillResponse payBill(Long billId, BigDecimal amount, String paymentMethod) {
        Bill bill = billRepository.findById(billId)
                .orElseThrow(() -> new ResourceNotFoundException("Bill not found with id: " + billId));

        BigDecimal newPaidAmount = bill.getPaidAmount().add(amount);
        bill.setPaidAmount(newPaidAmount);
        bill.setPaymentMethod(paymentMethod);

        if (newPaidAmount.compareTo(bill.getTotalAmount()) >= 0) {
            bill.setPaymentStatus(PaymentStatus.PAID);
        } else if (newPaidAmount.compareTo(BigDecimal.ZERO) > 0) {
            bill.setPaymentStatus(PaymentStatus.PARTIAL);
        }

        Bill saved = billRepository.save(bill);
        return billingMapper.toResponse(saved);
    }

    public BillResponse getBillByEncounter(Long encounterId) {
        Bill bill = billRepository.findByEncounterId(encounterId)
                .orElseThrow(() -> new ResourceNotFoundException("Bill not found for encounter: " + encounterId));
        return billingMapper.toResponse(bill);
    }

    public List<BillResponse> getTodayBills() {
        LocalDateTime startOfDay = java.time.LocalDate.now().atStartOfDay();
        LocalDateTime endOfDay = startOfDay.plusDays(1);
        return billRepository.findByCreatedAtBetweenOrderByCreatedAtDesc(startOfDay, endOfDay).stream()
                .map(billingMapper::toResponse)
                .toList();
    }

    public List<BillResponse> getPendingBills() {
        return billRepository.findByPaymentStatusInOrderByCreatedAtDesc(
                List.of(PaymentStatus.PENDING, PaymentStatus.PARTIAL)).stream()
                .map(billingMapper::toResponse)
                .toList();
    }

    public BigDecimal getTodayRevenue() {
        LocalDateTime startOfDay = java.time.LocalDate.now().atStartOfDay();
        LocalDateTime endOfDay = startOfDay.plusDays(1);
        BigDecimal revenue = billRepository.sumPaidAmountBetween(startOfDay, endOfDay);
        return revenue != null ? revenue : BigDecimal.ZERO;
    }

    public List<BillResponse> getAllBills() {
        return billRepository.findAll().stream()
                .sorted((a, b) -> {
                    if (b.getCreatedAt() == null) return -1;
                    if (a.getCreatedAt() == null) return 1;
                    return b.getCreatedAt().compareTo(a.getCreatedAt());
                })
                .map(billingMapper::toResponse)
                .toList();
    }

    public List<BillResponse> getBillsByDate(LocalDate date) {
        LocalDateTime startOfDay = date.atStartOfDay();
        LocalDateTime endOfDay = startOfDay.plusDays(1);
        return billRepository.findByCreatedAtBetweenOrderByCreatedAtDesc(startOfDay, endOfDay).stream()
                .map(billingMapper::toResponse)
                .toList();
    }

    public List<BillResponse> searchBills(String billNumber, String status) {
        return billRepository.findAll().stream()
                .filter(b -> {
                    boolean match = true;
                    if (billNumber != null && !billNumber.isBlank()) {
                        match = b.getBillNumber().toLowerCase().contains(billNumber.toLowerCase());
                    }
                    if (status != null && !status.isBlank()) {
                        match = match && b.getPaymentStatus().name().equalsIgnoreCase(status);
                    }
                    return match;
                })
                .sorted((a, b) -> {
                    if (b.getCreatedAt() == null) return -1;
                    if (a.getCreatedAt() == null) return 1;
                    return b.getCreatedAt().compareTo(a.getCreatedAt());
                })
                .map(billingMapper::toResponse)
                .toList();
    }

    @Transactional
    public void deleteBill(Long billId) {
        billRepository.findById(billId)
                .orElseThrow(() -> new ResourceNotFoundException("Bill not found with id: " + billId));
        billRepository.deleteById(billId);
    }
}
