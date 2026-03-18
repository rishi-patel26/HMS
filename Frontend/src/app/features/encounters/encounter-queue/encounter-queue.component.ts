import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, Subscription, debounceTime, distinctUntilChanged, switchMap, of } from 'rxjs';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { EncounterService } from '../../../core/services/encounter.service';
import { PatientService } from '../../../core/services/patient.service';
import { DataRefreshService } from '../../../core/services/data-refresh.service';
import { AuthService } from '../../../core/services/auth.service';
import { Role } from '../../../core/enums/role.enum';
import { Encounter, EncounterStatus, Patient } from '../../../core/models/hms.model';

@Component({
  selector: 'app-encounter-queue',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastModule],
  providers: [MessageService],
  templateUrl: './encounter-queue.component.html',
  styleUrl: './encounter-queue.component.scss'
})
export class EncounterQueueComponent implements OnInit, OnDestroy {
  encounters: Encounter[] = [];
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
    private encounterService: EncounterService,
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
      this.loadDoctorEncounters();
    } else {
      this.loadTodayEncounters();
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

    this.refreshSub = this.dataRefresh.onRefresh('encounters').subscribe(() => {
      if (this.viewMode === 'patient' && this.selectedPatient) {
        this.loadEncounters(this.selectedPatient.id);
      } else {
        this.loadTodayEncounters();
      }
    });
  }

  ngOnDestroy(): void {
    this.searchSub?.unsubscribe();
    this.refreshSub?.unsubscribe();
  }

  loadTodayEncounters(): void {
    this.loading = true;
    this.viewMode = 'today';
    this.encounterService.getTodayEncounters().subscribe({
      next: (data: Encounter[]) => {
        this.encounters = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  loadDoctorEncounters(): void {
    this.loading = true;
    this.viewMode = 'today';
    this.encounterService.getDoctorAllEncounters().subscribe({
      next: (data: Encounter[]) => {
        this.encounters = data;
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
      ? this.encounterService.getDoctorEncountersByDate(date)
      : this.encounterService.getEncountersByDate(date);
    obs.subscribe({
      next: (data: Encounter[]) => {
        this.encounters = data;
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
    this.loadEncounters(patient.id);
  }

  loadEncounters(patientId: number): void {
    this.loading = true;
    this.encounterService.getEncountersByPatient(patientId).subscribe({
      next: (data: Encounter[]) => {
        this.encounters = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  updateStatus(encounter: Encounter, status: EncounterStatus): void {
    this.encounterService.updateEncounterStatus(encounter.id, status).subscribe({
      next: () => {
        this.dataRefresh.triggerRefresh('encounters');
        this.dataRefresh.triggerRefresh('dashboard');
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update encounter status' });
        this.cdr.detectChanges();
      }
    });
  }

  checkInPatient(): void {
    const params = this.selectedPatient ? { patientId: this.selectedPatient.id } : {};
    this.router.navigate(['/encounters/checkin'], { queryParams: params });
  }

  viewDetails(encounterId: number): void {
    this.router.navigate(['/encounters', encounterId]);
  }

  clearPatient(): void {
    this.selectedPatient = null;
    this.encounters = [];
    this.viewMode = 'today';
    this.loadTodayEncounters();
  }
}
