import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { EncounterService } from '../../../core/services/encounter.service';
import { EpisodeService } from '../../../core/services/episode.service';
import { PatientService } from '../../../core/services/patient.service';
import { UserService } from '../../../core/services/user.service';
import { AppointmentService } from '../../../core/services/appointment.service';
import { DataRefreshService } from '../../../core/services/data-refresh.service';
import { Patient, Encounter, EncounterRequest, Appointment, Consultation, Bill, Episode } from '../../../core/models/hms.model';
import { User } from '../../../core/models/auth.model';
import { ConsultationService } from '../../../core/services/consultation.service';
import { BillingService } from '../../../core/services/billing.service';

@Component({
  selector: 'app-encounter-details',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './encounter-details.component.html',
  styleUrl: './encounter-details.component.scss'
})
export class EncounterDetailsComponent implements OnInit {
  mode: 'checkin' | 'view' = 'checkin';
  encounter: Encounter | null = null;
  checkinForm!: FormGroup;
  submitting = false;
  loading = false;
  errorMessage = '';
  initialized = false;

  patientSearchQuery = '';
  patientResults: Patient[] = [];
  selectedPatient: Patient | null = null;
  searchingPatient = false;

  doctors: User[] = [];
  patientAppointments: any[] = [];
  loadingAppointments = false;
  consultation: Consultation | null = null;
  bill: Bill | null = null;
  appointmentDetails: Appointment | null = null;
  episodeDetails: Episode | null = null;

  constructor(
    private fb: FormBuilder,
    private encounterService: EncounterService,
    private episodeService: EpisodeService,
    private patientService: PatientService,
    private userService: UserService,
    private appointmentService: AppointmentService,
    private consultationService: ConsultationService,
    private billingService: BillingService,
    private dataRefresh: DataRefreshService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    this.userService.getDoctors().subscribe({
      next: (doctors) => { this.doctors = doctors; this.cdr.detectChanges(); },
      error: () => {}
    });

    if (id) {
      this.mode = 'view';
      this.loadEncounter(Number(id));
      this.initialized = true;
    } else {
      this.mode = 'checkin';
      this.initCheckinForm();

      const patientId = this.route.snapshot.queryParamMap.get('patientId');
      if (patientId) {
        this.patientService.getPatientById(Number(patientId)).subscribe({
          next: (patient: Patient) => {
            this.selectedPatient = patient;
            this.checkinForm.patchValue({ patientId: patient.id });
            this.loadPatientAppointments(patient.id);
            this.initialized = true;
            this.cdr.detectChanges();
          },
          error: () => {
            this.initialized = true;
            this.cdr.detectChanges();
          }
        });
      } else {
        this.initialized = true;
      }
    }
  }

  initCheckinForm(): void {
    this.checkinForm = this.fb.group({
      patientId: [null, Validators.required],
      doctorId: [null, Validators.required],
      appointmentId: [null, Validators.required],
      visitType: ['OPD', Validators.required]
    });
  }

  loadEncounter(id: number): void {
    this.loading = true;
    this.encounterService.getEncounterById(id).subscribe({
      next: (data: Encounter) => {
        this.encounter = data;
        this.loading = false;

        this.consultationService.getConsultationByEncounter(data.id).subscribe({
          next: (c) => { this.consultation = c; this.cdr.detectChanges(); },
          error: () => {} // No consultation yet
        });

        this.billingService.getBillByEncounter(data.id).subscribe({
          next: (b) => { this.bill = b; this.cdr.detectChanges(); },
          error: () => {} // No bill yet
        });

        if (data.appointmentId) {
          this.appointmentService.getAppointmentById(data.appointmentId).subscribe({
            next: (apt) => { this.appointmentDetails = apt; this.cdr.detectChanges(); },
            error: () => {}
          });
        }

        if (data.episodeId) {
          this.episodeService.getEpisodeById(data.episodeId).subscribe({
            next: (episode) => { this.episodeDetails = episode; this.cdr.detectChanges(); },
            error: () => {}
          });
        }

        this.cdr.detectChanges();
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  searchPatient(): void {
    if (!this.patientSearchQuery.trim()) {
      this.patientResults = [];
      this.cdr.detectChanges();
      return;
    }
    this.searchingPatient = true;
    this.patientService.searchPatients(this.patientSearchQuery).subscribe({
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
    this.checkinForm.patchValue({ patientId: patient.id });
    this.patientResults = [];
    this.patientSearchQuery = '';
    this.loadPatientAppointments(patient.id);
    this.cdr.detectChanges();
  }

  clearPatient(): void {
    this.selectedPatient = null;
    this.checkinForm.patchValue({ patientId: null, appointmentId: null, doctorId: null });
    this.patientAppointments = [];
    this.cdr.detectChanges();
  }

  selectAppointment(apt: any): void {
    this.checkinForm.patchValue({
      appointmentId: apt.id,
      doctorId: apt.doctorId
    });
    this.cdr.detectChanges();
  }

  loadPatientAppointments(patientId: number): void {
    this.loadingAppointments = true;
    this.patientAppointments = [];
    this.appointmentService.getAppointmentsByPatient(patientId).subscribe({
      next: (appointments) => {
        this.patientAppointments = appointments.filter(a => a.status === 'SCHEDULED');
        this.loadingAppointments = false;
        this.cdr.detectChanges();
      },
      error: () => { this.loadingAppointments = false; this.cdr.detectChanges(); }
    });
  }

  onCheckIn(): void {
    if (this.checkinForm.invalid) {
      this.checkinForm.markAllAsTouched();
      this.cdr.detectChanges();
      return;
    }

    this.submitting = true;
    this.errorMessage = '';

    const request: EncounterRequest = this.checkinForm.value;
    this.encounterService.checkInPatient(request).subscribe({
      next: () => {
        this.submitting = false;
        this.dataRefresh.triggerRefresh('encounters');
        this.dataRefresh.triggerRefresh('appointments');
        this.dataRefresh.triggerRefresh('dashboard');
        this.router.navigate(['/encounters']);
      },
      error: (err: { error?: { message?: string } }) => {
        this.submitting = false;
        this.errorMessage = err.error?.message || 'Check-in failed';
        this.cdr.detectChanges();
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/encounters']);
  }

  isInvalid(field: string): boolean {
    const control = this.checkinForm?.get(field);
    return !!control && control.invalid && control.touched;
  }
}
