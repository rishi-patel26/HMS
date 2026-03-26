package com.example.HMS_backend.billing.mapper;

import com.example.HMS_backend.billing.dto.BillItemResponse;
import com.example.HMS_backend.billing.dto.BillResponse;
import com.example.HMS_backend.billing.dto.PaymentResponse;
import com.example.HMS_backend.billing.entity.Bill;
import com.example.HMS_backend.billing.entity.BillItem;
import com.example.HMS_backend.billing.entity.Payment;
import com.example.HMS_backend.encounter.repository.EncounterRepository;
import com.example.HMS_backend.patient.repository.PatientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class BillingMapper {

    private final EncounterRepository encounterRepository;
    private final PatientRepository patientRepository;

    public BillResponse toResponse(Bill bill) {
        List<BillItemResponse> itemResponses = bill.getItems().stream()
                .map(this::toItemResponse)
                .toList();

        List<PaymentResponse> paymentResponses = bill.getPayments().stream()
                .map(this::toPaymentResponse)
                .toList();

        BillResponse.BillResponseBuilder builder = BillResponse.builder()
                .id(bill.getId())
                .billNumber(bill.getBillNumber())
                .encounterId(bill.getEncounterId())
                .totalAmount(bill.getTotalAmount())
                .paidAmount(bill.getPaidAmount())
                .paymentStatus(bill.getPaymentStatus())
                .paymentMethod(bill.getPaymentMethod())
                .items(itemResponses)
                .payments(paymentResponses)
                .createdAt(bill.getCreatedAt());

        // Resolve patient name via encounter -> patient
        encounterRepository.findById(bill.getEncounterId()).ifPresent(encounter -> {
            builder.patientId(encounter.getPatientId());

            patientRepository.findById(encounter.getPatientId())
                            .ifPresent(p -> {
                                builder.patientName(p.getFirstName() + " " + p.getLastName());
                                builder.patientUhid(p.getUhid());
                            });
        });

        return builder.build();
    }

    public BillItemResponse toItemResponse(BillItem item) {
        return BillItemResponse.builder()
                .id(item.getId())
                .serviceId(item.getServiceId())
                .serviceName(item.getServiceName())
                .price(item.getPrice())
                .quantity(item.getQuantity())
                .subtotal(item.getSubtotal())
                .build();
    }

    public PaymentResponse toPaymentResponse(Payment payment) {
        return PaymentResponse.builder()
                .id(payment.getId())
                .amount(payment.getAmount())
                .paymentMethod(payment.getPaymentMethod())
                .transactionReference(payment.getTransactionReference())
                .createdAt(payment.getCreatedAt())
                .build();
    }
}
