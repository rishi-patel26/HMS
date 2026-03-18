import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, Subscription, debounceTime, distinctUntilChanged, switchMap, of } from 'rxjs';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { AppointmentService } from '../../../core/services/appointment.service';
import { PatientService } from '../../../core/services/patient.service';
import { DataRefreshService } from '../../../core/services/data-refresh.service';
import { AuthService } from '../../../core/services/auth.service';
import { Role } from '../../../core/enums/role.enum';
import { Appointment, AppointmentStatus, Patient } from '../../../core/models/hms.model';

@Component({
  selector: 'app-appointment-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastModule],
  providers: [MessageService],
  templateUrl: './appointment-list.component.html',
  styleUrl: './appointment-list.component.scss'
})
export class AppointmentListComponent implements OnInit, OnDestroy {
  appointments: Appointment[] = [];
  searchQuery = '';
  selectedPatient: Patient | null = null;
  searchResults: Patient[] = [];
  loading = false;
  searchingPatient = false;
  viewMode: 'today' | 'patient' = 'today';
  selectedDate = '';
  userRole: string | null = null;

  private searchSubject = new Subject<string>();
  private searchSub!: Subscription;
  private refreshSub!: Subscription;

  constructor(
    private appointmentService: AppointmentService,
    private patientService: PatientService,
    private dataRefresh: DataRefreshService,
    private authService: AuthService,
    private router: Router,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.userRole = this.authService.getUserRole();

    if (this.userRole === Role.DOCTOR) {
      this.loadDoctorAppointments();
    } else {
      this.loadTodayAppointments();
    }

    this.searchSub = this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      switchMap((query: string) => {
        const trimmed = query.trim();
        if (!trimmed) {
          return of([]);
        }
        this.searchingPatient = true;
        return this.patientService.searchPatients(trimmed);
      })
    ).subscribe({
      next: (patients: Patient[]) => {
        this.searchResults = patients;
        this.searchingPatient = false;
        this.cdr.detectChanges();
      },
      error: () => { this.searchingPatient = false; this.cdr.detectChanges(); }
    });

    this.refreshSub = this.dataRefresh.onRefresh('appointments').subscribe(() => {
      if (this.viewMode === 'patient' && this.selectedPatient) {
        this.loadAppointments(this.selectedPatient.id);
      } else {
        this.loadTodayAppointments();
      }
    });
  }

  ngOnDestroy(): void {
    this.searchSub?.unsubscribe();
    this.refreshSub?.unsubscribe();
  }

  loadTodayAppointments(): void {
    this.loading = true;
    this.viewMode = 'today';
    this.appointmentService.getTodayAppointments().subscribe({
      next: (data: Appointment[]) => {
        this.appointments = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  loadDoctorAppointments(): void {
    this.loading = true;
    this.viewMode = 'today';
    this.appointmentService.getDoctorAllAppointments().subscribe({
      next: (data: Appointment[]) => {
        this.appointments = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  onDateChange(date: string): void {
    if (!date) return;
    this.loading = true;
    const obs = this.userRole === Role.DOCTOR
      ? this.appointmentService.getDoctorAppointmentsByDate(date)
      : this.appointmentService.getAppointmentsByDate(date);
    obs.subscribe({
      next: (data: Appointment[]) => {
        this.appointments = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  onSearchInput(): void {
    this.searchSubject.next(this.searchQuery);
  }

  searchPatient(): void {
    if (!this.searchQuery.trim()) {
      this.searchResults = [];
      return;
    }
    this.searchingPatient = true;
    this.patientService.searchPatients(this.searchQuery).subscribe({
      next: (patients: Patient[]) => {
        this.searchResults = patients;
        this.searchingPatient = false;
        this.cdr.detectChanges();
      },
      error: () => { this.searchingPatient = false; this.cdr.detectChanges(); }
    });
  }

  selectPatient(patient: Patient): void {
    this.selectedPatient = patient;
    this.searchResults = [];
    this.searchQuery = '';
    this.viewMode = 'patient';
    this.loadAppointments(patient.id);
  }

  loadAppointments(patientId: number): void {
    this.loading = true;
    this.appointmentService.getAppointmentsByPatient(patientId).subscribe({
      next: (data: Appointment[]) => {
        this.appointments = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  updateStatus(appointment: Appointment, status: AppointmentStatus): void {
    this.appointmentService.updateAppointmentStatus(appointment.id, status).subscribe({
      next: () => {
        this.dataRefresh.triggerRefresh('appointments');
        this.dataRefresh.triggerRefresh('dashboard');
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update appointment status' });
      }
    });
  }

  deleteAppointment(appointment: Appointment): void {
    if (!confirm(`Delete appointment for ${appointment.patientName}?`)) return;
    this.appointmentService.deleteAppointment(appointment.id).subscribe({
      next: () => {
        this.dataRefresh.triggerRefresh('appointments');
        this.dataRefresh.triggerRefresh('dashboard');
        this.messageService.add({ severity: 'success', summary: 'Deleted', detail: 'Appointment deleted' });
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete appointment' });
      }
    });
  }

  bookNewAppointment(): void {
    const params = this.selectedPatient ? { patientId: this.selectedPatient.id } : {};
    this.router.navigate(['/appointments/new'], { queryParams: params });
  }

  clearPatient(): void {
    this.selectedPatient = null;
    this.appointments = [];
    this.viewMode = 'today';
    this.loadTodayAppointments();
  }
}
