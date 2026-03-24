package com.example.HMS_backend.dashboard.service;

import com.example.HMS_backend.appointment.repository.AppointmentRepository;
import com.example.HMS_backend.billing.repository.BillRepository;
import com.example.HMS_backend.billing.enums.PaymentStatus;
import com.example.HMS_backend.consultation.repository.ConsultationRepository;
import com.example.HMS_backend.dashboard.dto.*;
import com.example.HMS_backend.encounter.entity.Encounter;
import com.example.HMS_backend.encounter.enums.EncounterStatus;
import com.example.HMS_backend.encounter.repository.EncounterRepository;
import com.example.HMS_backend.entity.User;
import com.example.HMS_backend.episode.repository.EpisodeRepository;
import com.example.HMS_backend.patient.repository.PatientRepository;
import com.example.HMS_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final PatientRepository patientRepository;
    private final AppointmentRepository appointmentRepository;
    private final EncounterRepository encounterRepository;
    private final EpisodeRepository episodeRepository;
    private final BillRepository billRepository;
    private final UserRepository userRepository;
    private final ConsultationRepository consultationRepository;

    public DashboardStats getAdminStats() {
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime endOfDay = startOfDay.plusDays(1);

        BigDecimal todayRevenue = billRepository.sumPaidAmountBetween(startOfDay, endOfDay);
        BigDecimal totalRevenue = billRepository.sumPaidAmountBetween(
                LocalDateTime.of(2000, 1, 1, 0, 0), endOfDay);

        long todayConsultations = consultationRepository
                .findByCreatedAtBetweenOrderByCreatedAtDesc(startOfDay, endOfDay).size();
        long todayBills = billRepository.countByCreatedAtBetween(startOfDay, endOfDay);

        return DashboardStats.builder()
                .totalPatients(patientRepository.count())
                .totalAppointmentsToday(appointmentRepository.countByAppointmentTimeBetween(startOfDay, endOfDay))
                .totalEncountersToday(encounterRepository.countByCreatedAtBetween(startOfDay, endOfDay))
                .totalRevenueToday(todayRevenue != null ? todayRevenue : BigDecimal.ZERO)
                .activeEpisodes(episodeRepository.countByStatus("ACTIVE"))
                .totalUsers(userRepository.count())
                .totalAppointments(appointmentRepository.count())
                .totalConsultations(consultationRepository.count())
                .totalBills(billRepository.count())
                .totalEncounters(encounterRepository.count())
                .totalEpisodes(episodeRepository.count())
                .totalRevenue(totalRevenue != null ? totalRevenue : BigDecimal.ZERO)
                .todayConsultations(todayConsultations)
                .todayBills(todayBills)
                .build();
    }

    public DashboardStats getFrontdeskStats() {
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime endOfDay = startOfDay.plusDays(1);

        List<Encounter> todayEncounters = encounterRepository.findByCreatedAtBetweenOrderByCreatedAtDesc(startOfDay, endOfDay);
        long waiting = todayEncounters.stream().filter(e -> e.getStatus() == EncounterStatus.WAITING).count();
        long checkedIn = todayEncounters.stream().filter(e -> e.getStatus() == EncounterStatus.IN_CONSULTATION).count();

        BigDecimal todayRevenue = billRepository.sumPaidAmountBetween(startOfDay, endOfDay);
        BigDecimal totalRevenue = billRepository.sumPaidAmountBetween(
                LocalDateTime.of(2000, 1, 1, 0, 0), endOfDay);

        long todayBills = billRepository.countByCreatedAtBetween(startOfDay, endOfDay);

        return DashboardStats.builder()
                .todayAppointments(appointmentRepository.countByAppointmentTimeBetween(startOfDay, endOfDay))
                .waitingPatients(waiting)
                .checkedInPatients(checkedIn)
                .pendingBills(billRepository.countByPaymentStatusIn(List.of(PaymentStatus.PENDING, PaymentStatus.PARTIAL)))
                .todayRevenue(todayRevenue != null ? todayRevenue : BigDecimal.ZERO)
                .totalAppointmentsAll(appointmentRepository.count())
                .totalEncountersAll(encounterRepository.count())
                .totalEpisodesAll(episodeRepository.count())
                .totalPatientsAll(patientRepository.count())
                .totalRevenueAll(totalRevenue != null ? totalRevenue : BigDecimal.ZERO)
                .totalBills(billRepository.count())
                .todayBills(todayBills)
                .build();
    }

    public DashboardStats getDoctorStats(String doctorUsername) {
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime endOfDay = startOfDay.plusDays(1);

        User doctor = userRepository.findByUsername(doctorUsername).orElse(null);
        Long doctorId = doctor != null ? doctor.getId() : -1L;

        List<Encounter> doctorTodayEncounters = encounterRepository
                .findByDoctorIdAndCreatedAtBetweenOrderByCreatedAtDesc(doctorId, startOfDay, endOfDay);
        List<Encounter> doctorAllEncounters = encounterRepository
                .findByDoctorIdOrderByCreatedAtDesc(doctorId);

        long waiting = doctorTodayEncounters.stream().filter(e -> e.getStatus() == EncounterStatus.WAITING).count();
        long queue = doctorTodayEncounters.stream().filter(e ->
                e.getStatus() == EncounterStatus.WAITING || e.getStatus() == EncounterStatus.IN_CONSULTATION).count();
        long completedToday = doctorTodayEncounters.stream()
                .filter(e -> e.getStatus() == EncounterStatus.COMPLETED).count();

        var allConsultations = consultationRepository.findByCreatedByOrderByCreatedAtDesc(doctorUsername);
        long todayConsultations = allConsultations.stream()
                .filter(c -> c.getCreatedAt() != null && c.getCreatedAt().isAfter(startOfDay) && c.getCreatedAt().isBefore(endOfDay))
                .count();
        long totalConsultations = allConsultations.size();

        long doctorTodayAppointments = appointmentRepository.countByDoctorIdAndAppointmentTimeBetween(doctorId, startOfDay, endOfDay);
        long doctorTotalAppointments = appointmentRepository.findByDoctorIdOrderByAppointmentTimeDesc(doctorId).size();

        return DashboardStats.builder()
                .encounterQueue(queue)
                .patientsWaiting(waiting)
                .doctorActiveEpisodes(episodeRepository.countByStatus("ACTIVE"))
                .doctorTodayAppointments(doctorTodayAppointments)
                .doctorCompletedConsultations(totalConsultations)
                .doctorTodayPatients(doctorTodayEncounters.size())
                .doctorTotalAppointments(doctorTotalAppointments)
                .doctorTotalConsultations(totalConsultations)
                .doctorTotalEncounters(doctorAllEncounters.size())
                .doctorTodayConsultations(todayConsultations)
                .doctorCompletedToday(completedToday)
                .todayConsultations(todayConsultations)
                .build();
    }

    public DailyTrendResponse getDailyTrends(LocalDate from, LocalDate to) {
        LocalDateTime start = from.atStartOfDay();
        LocalDateTime end = to.plusDays(1).atStartOfDay();

        Map<LocalDate, Long> patientMap = toDateCountMap(patientRepository.countByDayBetween(start, end));
        Map<LocalDate, Long> appointmentMap = toDateCountMap(appointmentRepository.countByDayBetween(start, end));
        Map<LocalDate, Long> consultationMap = toDateCountMap(consultationRepository.countByDayBetween(start, end));

        List<LocalDate> allDays = from.datesUntil(to.plusDays(1)).toList();
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("MMM dd");

        List<String> labels = allDays.stream().map(d -> d.format(fmt)).toList();
        List<Long> patients = allDays.stream().map(d -> patientMap.getOrDefault(d, 0L)).toList();
        List<Long> appointments = allDays.stream().map(d -> appointmentMap.getOrDefault(d, 0L)).toList();
        List<Long> consultations = allDays.stream().map(d -> consultationMap.getOrDefault(d, 0L)).toList();

        return DailyTrendResponse.builder()
                .labels(labels)
                .patientRegistrations(patients)
                .appointments(appointments)
                .consultations(consultations)
                .build();
    }

    public RevenueTrendResponse getRevenueTrends(LocalDate from, LocalDate to) {
        LocalDateTime start = from.atStartOfDay();
        LocalDateTime end = to.plusDays(1).atStartOfDay();

        Map<LocalDate, BigDecimal> revenueMap = new LinkedHashMap<>();
        for (Object[] row : billRepository.sumRevenueByDayBetween(start, end)) {
            LocalDate day = row[0] instanceof java.sql.Date
                    ? ((java.sql.Date) row[0]).toLocalDate()
                    : LocalDate.parse(row[0].toString());
            BigDecimal amount = row[1] instanceof BigDecimal
                    ? (BigDecimal) row[1]
                    : new BigDecimal(row[1].toString());
            revenueMap.put(day, amount);
        }

        List<LocalDate> allDays = from.datesUntil(to.plusDays(1)).toList();
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("MMM dd");

        List<String> labels = allDays.stream().map(d -> d.format(fmt)).toList();
        List<BigDecimal> revenueData = allDays.stream()
                .map(d -> revenueMap.getOrDefault(d, BigDecimal.ZERO))
                .toList();

        return RevenueTrendResponse.builder()
                .labels(labels)
                .revenueData(revenueData)
                .build();
    }

    private Map<LocalDate, Long> toDateCountMap(List<Object[]> rows) {
        Map<LocalDate, Long> map = new LinkedHashMap<>();
        for (Object[] row : rows) {
            LocalDate day = row[0] instanceof java.sql.Date
                    ? ((java.sql.Date) row[0]).toLocalDate()
                    : LocalDate.parse(row[0].toString());
            Long count = row[1] instanceof Long ? (Long) row[1] : ((Number) row[1]).longValue();
            map.put(day, count);
        }
        return map;
    }
    
    public EncounterStatusDistribution getEncounterStatusDistribution() {
        List<Object[]> results = encounterRepository.countByStatus();
        
        List<String> labels = new ArrayList<>();
        List<Long> data = new ArrayList<>();
        List<String> colors = new ArrayList<>();
        
        Map<String, String> statusColors = Map.of(
            "WAITING", "#FFA726",
            "IN_CONSULTATION", "#42A5F5",
            "COMPLETED", "#66BB6A",
            "CANCELLED", "#EF5350"
        );
        
        for (Object[] row : results) {
            String status = (String) row[0];
            Long count = ((Number) row[1]).longValue();
            labels.add(status.replace("_", " "));
            data.add(count);
            colors.add(statusColors.getOrDefault(status, "#9E9E9E"));
        }
        
        return EncounterStatusDistribution.builder()
                .labels(labels)
                .data(data)
                .colors(colors)
                .build();
    }
    
    public List<AppointmentCalendarEvent> getAppointmentCalendarEvents(LocalDate from, LocalDate to) {
        LocalDateTime start = from.atStartOfDay();
        LocalDateTime end = to.plusDays(1).atStartOfDay();
        
        var appointments = appointmentRepository.findByAppointmentTimeBetween(start, end);
        
        Map<String, String> statusColors = Map.of(
            "SCHEDULED", "#42A5F5",
            "CHECKED_IN", "#66BB6A",
            "CANCELLED", "#EF5350",
            "COMPLETED", "#9E9E9E"
        );
        
        return appointments.stream().map(apt -> {
            var patient = patientRepository.findById(apt.getPatientId()).orElse(null);
            var doctor = userRepository.findById(apt.getDoctorId()).orElse(null);
            
            String patientName = patient != null ? patient.getFirstName() + " " + patient.getLastName() : "Unknown";
            String doctorName = doctor != null ? "Dr. " + doctor.getUsername() : "Unknown";
            String color = statusColors.getOrDefault(apt.getStatus().name(), "#9E9E9E");
            
            return AppointmentCalendarEvent.builder()
                    .id(apt.getId())
                    .title(patientName + " - " + doctorName)
                    .start(apt.getAppointmentTime())
                    .end(apt.getAppointmentTime().plusMinutes(30))
                    .patientName(patientName)
                    .doctorName(doctorName)
                    .status(apt.getStatus().name())
                    .backgroundColor(color)
                    .borderColor(color)
                    .build();
        }).toList();
    }
    
    public DepartmentStats getDepartmentStats() {
        List<Object[]> deptAppointments = appointmentRepository.countByDepartment();
        
        Map<String, Long> appointmentMap = new LinkedHashMap<>();
        for (Object[] row : deptAppointments) {
            String dept = row[0] != null ? (String) row[0] : "General";
            Long count = ((Number) row[1]).longValue();
            appointmentMap.put(dept, count);
        }
        
        List<String> departments = new ArrayList<>(appointmentMap.keySet());
        List<Long> appointmentCounts = new ArrayList<>(appointmentMap.values());
        List<Long> consultationCounts = departments.stream()
                .map(dept -> 0L) // Can be enhanced with actual consultation data
                .toList();
        
        return DepartmentStats.builder()
                .departments(departments)
                .appointmentCounts(appointmentCounts)
                .consultationCounts(consultationCounts)
                .build();
    }
}