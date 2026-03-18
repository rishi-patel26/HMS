package com.example.HMS_backend.util;

import com.example.HMS_backend.billing.repository.BillRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
@RequiredArgsConstructor
public class BillNumberGenerator {

    private final BillRepository billRepository;

    public String generateBillNumber() {
        int year = LocalDate.now().getYear();
        long count = billRepository.count() + 1;
        return String.format("BILL-%d-%05d", year, count);
    }
}
