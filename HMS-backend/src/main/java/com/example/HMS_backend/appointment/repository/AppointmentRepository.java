package com.example.HMS_backend.appointment.repository;

import com.example.HMS_backend.appointment.entity.Appointment;
import com.example.HMS_backend.appointment.enums.AppointmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    @Query("SELECT CAST(a.appointmentTime AS date) AS day, COUNT(a) FROM Appointment a " +
           "WHERE a.appointmentTime BETWEEN :start AND :end GROUP BY CAST(a.appointmentTime AS date) ORDER BY day")
    List<Object[]> countByDayBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    List<Appointment> findByPatientIdOrderByAppointmentTimeDesc(Long patientId);

    List<Appointment> findByAppointmentTimeBetweenOrderByAppointmentTimeAsc(LocalDateTime start, LocalDateTime end);
    
    List<Appointment> findByAppointmentTimeBetween(LocalDateTime start, LocalDateTime end);

    long countByAppointmentTimeBetween(LocalDateTime start, LocalDateTime end);

    List<Appointment> findByDoctorIdAndAppointmentTimeBetweenAndStatusNot(Long doctorId, LocalDateTime start, LocalDateTime end, AppointmentStatus status);

    List<Appointment> findByDoctorIdAndAppointmentTimeBetweenOrderByAppointmentTimeAsc(Long doctorId, LocalDateTime start, LocalDateTime end);

    long countByDoctorIdAndAppointmentTimeBetween(Long doctorId, LocalDateTime start, LocalDateTime end);

    List<Appointment> findByDoctorIdOrderByAppointmentTimeDesc(Long doctorId);
    
    @Query("SELECT COALESCE(a.department, 'General'), COUNT(a) FROM Appointment a GROUP BY a.department ORDER BY COUNT(a) DESC")
    List<Object[]> countByDepartment();
}
