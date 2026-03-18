import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { BillingService } from '../../../core/services/billing.service';
import { EncounterService } from '../../../core/services/encounter.service';
import { PatientService } from '../../../core/services/patient.service';
import { DataRefreshService } from '../../../core/services/data-refresh.service';
import { AuthService } from '../../../core/services/auth.service';
import { Role } from '../../../core/enums/role.enum';
import { Bill, Encounter, Patient } from '../../../core/models/hms.model';

@Component({
  selector: 'app-create-bill',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-bill.component.html',
  styleUrl: './create-bill.component.scss'
})
export class CreateBillComponent implements OnInit, OnDestroy {
  encounterId: number | null = null;
  selectedEncounter: Encounter | null = null;
  submitting = false;
  submittingEncounterId: number | null = null;
  errorMessage = '';

  patientSearchQuery = '';
  patientResults: Patient[] = [];
  selectedPatient: Patient | null = null;
  searchingPatient = false;

  patientEncounters: Encounter[] = [];
  loadingEncounters = false;

  private readonly destroy$ = new Subject<void>();

  constructor(
    private billingService: BillingService,
    private encounterService: EncounterService,
    private patientService: PatientService,
    private dataRefresh: DataRefreshService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const role = this.authService.getUserRole();
    if (role === Role.DOCTOR) {
      this.errorMessage = 'Doctors cannot create bills. Only Admin and Frontdesk can.';
      return;
    }

    const eid = this.route.snapshot.queryParamMap.get('encounterId');
    if (eid) {
      this.encounterId = Number(eid);
      this.encounterService.getEncounterById(this.encounterId).pipe(takeUntil(this.destroy$)).subscribe({
        next: (enc) => { this.selectedEncounter = enc; this.cdr.detectChanges(); },
        error: () => { this.errorMessage = 'Encounter not found'; this.cdr.detectChanges(); }
      });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  searchPatient(): void {
    if (!this.patientSearchQuery.trim()) {
      this.patientResults = [];
      return;
    }
    this.searchingPatient = true;
    this.errorMessage = '';
    this.patientService.searchPatients(this.patientSearchQuery).pipe(takeUntil(this.destroy$)).subscribe({
      next: (patients: Patient[]) => {
        this.patientResults = patients;
        this.searchingPatient = false;
        this.cdr.detectChanges();
      },
      error: () => { this.searchingPatient = false; this.cdr.detectChanges(); }
    });
  }

  selectPatient(patient: Patient): void {
    this.selectedPatient = patient;
    this.patientResults = [];
    this.patientSearchQuery = '';
    this.errorMessage = '';
    this.loadEncounters(patient.id);
  }

  loadEncounters(patientId: number): void {
    this.loadingEncounters = true;
    this.encounterService.getEncountersByPatient(patientId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (encounters: Encounter[]) => {
        this.patientEncounters = encounters;
        this.loadingEncounters = false;
        this.cdr.detectChanges();
      },
      error: () => { this.loadingEncounters = false; this.cdr.detectChanges(); }
    });
  }

  clearSelection(): void {
    this.selectedPatient = null;
    this.selectedEncounter = null;
    this.encounterId = null;
    this.patientEncounters = [];
    this.errorMessage = '';
  }

  createBillForEncounter(encounter: Encounter): void {
    this.selectedEncounter = encounter;
    this.encounterId = encounter.id;
    this.createBill();
  }

  createBill(): void {
    if (!this.encounterId) {
      this.errorMessage = 'Please select an encounter';
      return;
    }

    this.submitting = true;
    this.submittingEncounterId = this.encounterId;
    this.errorMessage = '';

    this.billingService.createBill(this.encounterId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (bill: Bill) => {
        this.submitting = false;
        this.submittingEncounterId = null;
        this.dataRefresh.triggerRefresh('billing');
        this.dataRefresh.triggerRefresh('dashboard');
        this.cdr.detectChanges();
        this.router.navigate(['/billing', bill.id]);
      },
      error: (err: { error?: { message?: string } }) => {
        this.submitting = false;
        this.submittingEncounterId = null;
        this.errorMessage = err.error?.message || 'Failed to create bill';
        this.cdr.detectChanges();
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/encounters']);
  }
}
