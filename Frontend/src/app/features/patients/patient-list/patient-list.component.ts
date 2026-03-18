import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, Subscription, debounceTime, distinctUntilChanged, switchMap, of } from 'rxjs';
import { PatientService } from '../../../core/services/patient.service';
import { DataRefreshService } from '../../../core/services/data-refresh.service';
import { AuthService } from '../../../core/services/auth.service';
import { Patient } from '../../../core/models/hms.model';

@Component({
  selector: 'app-patient-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './patient-list.component.html',
  styleUrl: './patient-list.component.scss'
})
export class PatientListComponent implements OnInit, OnDestroy {
  patients: Patient[] = [];
  searchQuery = '';
  loading = false;
  searched = false;
  userRole: string | null = null;

  private searchSubject = new Subject<string>();
  private searchSub!: Subscription;
  private refreshSub!: Subscription;

  constructor(
    private patientService: PatientService,
    private dataRefresh: DataRefreshService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.userRole = this.authService.getUserRole();
    this.loadRecentPatients();

    this.searchSub = this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      switchMap((query: string) => {
        const trimmed = query.trim();
        if (!trimmed) {
          this.searched = false;
          this.loading = true;
          return this.patientService.getRecentPatients();
        }
        this.loading = true;
        this.searched = true;
        return this.patientService.searchPatients(trimmed);
      })
    ).subscribe({
      next: (data: Patient[]) => {
        this.patients = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });

    this.refreshSub = this.dataRefresh.onRefresh('patients').subscribe(() => {
      if (this.searchQuery.trim()) {
        this.searchPatients();
      } else {
        this.loadRecentPatients();
      }
    });
  }

  ngOnDestroy(): void {
    this.searchSub?.unsubscribe();
    this.refreshSub?.unsubscribe();
  }

  loadRecentPatients(): void {
    this.loading = true;
    this.searched = false;
    this.patientService.getRecentPatients().subscribe({
      next: (data: Patient[]) => {
        this.patients = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onSearchInput(): void {
    this.searchSubject.next(this.searchQuery);
  }

  searchPatients(): void {
    if (!this.searchQuery.trim()) {
      this.loadRecentPatients();
      return;
    }
    this.loading = true;
    this.searched = true;
    this.patientService.searchPatients(this.searchQuery).subscribe({
      next: (data: Patient[]) => {
        this.patients = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  openPatientProfile(id: number): void {
    this.router.navigate(['/patients', id]);
  }

  bookAppointment(patientId: number): void {
    this.router.navigate(['/appointments/new'], { queryParams: { patientId } });
  }

  checkInPatient(patientId: number): void {
    this.router.navigate(['/encounters/checkin'], { queryParams: { patientId } });
  }

  openNewPatientForm(): void {
    this.router.navigate(['/patients/new']);
  }

  deletePatient(patient: any): void {
    if (!confirm(`Delete patient ${patient.firstName} ${patient.lastName} (${patient.uhid})?`)) return;
    this.patientService.deletePatient(patient.id).subscribe({
      next: () => {
        this.dataRefresh.triggerRefresh('patients');
      },
      error: () => {}
    });
  }
}
