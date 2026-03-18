package com.example.HMS_backend.billing.controller;

import com.example.HMS_backend.billing.dto.BillItemRequest;
import com.example.HMS_backend.billing.dto.BillResponse;
import com.example.HMS_backend.billing.dto.PaymentRequest;
import com.example.HMS_backend.billing.service.BillingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/bills")
@RequiredArgsConstructor
public class BillingController {

    private final BillingService billingService;

    @PostMapping("/create/{encounterId}")
    public ResponseEntity<BillResponse> createBill(@PathVariable Long encounterId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(billingService.createBill(encounterId));
    }

    @PostMapping("/{billId}/items")
    public ResponseEntity<BillResponse> addBillItem(@PathVariable Long billId,
                                                     @Valid @RequestBody BillItemRequest request) {
        return ResponseEntity.ok(billingService.addBillItem(billId, request));
    }

    @GetMapping("/{billId}")
    public ResponseEntity<BillResponse> getBill(@PathVariable Long billId) {
        return ResponseEntity.ok(billingService.getBill(billId));
    }

    @PostMapping("/{billId}/pay")
    public ResponseEntity<BillResponse> payBill(@PathVariable Long billId,
                                                 @Valid @RequestBody PaymentRequest request) {
        return ResponseEntity.ok(billingService.payBill(billId, request.getAmount(), request.getPaymentMethod()));
    }

    @GetMapping("/encounter/{encounterId}")
    public ResponseEntity<BillResponse> getBillByEncounter(@PathVariable Long encounterId) {
        return ResponseEntity.ok(billingService.getBillByEncounter(encounterId));
    }

    @GetMapping("/today")
    public ResponseEntity<List<BillResponse>> getTodayBills() {
        return ResponseEntity.ok(billingService.getTodayBills());
    }

    @GetMapping("/pending")
    public ResponseEntity<List<BillResponse>> getPendingBills() {
        return ResponseEntity.ok(billingService.getPendingBills());
    }

    @GetMapping("/all")
    @PreAuthorize("hasAnyRole('ADMIN', 'FRONTDESK')")
    public ResponseEntity<List<BillResponse>> getAllBills() {
        return ResponseEntity.ok(billingService.getAllBills());
    }

    @GetMapping("/by-date")
    @PreAuthorize("hasAnyRole('ADMIN', 'FRONTDESK')")
    public ResponseEntity<List<BillResponse>> getBillsByDate(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(billingService.getBillsByDate(date));
    }

    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('ADMIN', 'FRONTDESK')")
    public ResponseEntity<List<BillResponse>> searchBills(
            @RequestParam(required = false) String billNumber,
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(billingService.searchBills(billNumber, status));
    }

    @DeleteMapping("/{billId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteBill(@PathVariable Long billId) {
        billingService.deleteBill(billId);
        return ResponseEntity.noContent().build();
    }
}
