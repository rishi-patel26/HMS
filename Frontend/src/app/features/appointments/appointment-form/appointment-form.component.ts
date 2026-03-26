import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AppointmentService } from '../../../core/services/appointment.service';
import { PatientService } from '../../../core/services/patient.service';
import { DataRefreshService } from '../../../core/services/data-refresh.service';
import { UserService } from '../../../core/services/user.service';
import { User } from '../../../core/models/auth.model';
import { Patient } from '../../../core/models/hms.model';

@Component({
  selector: 'app-appointment-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './appointment-form.component.html',
  styleUrl: './appointment-form.component.scss'
})
export class AppointmentFormComponent implements OnInit {
  appointmentForm!: FormGroup;
  submitting = false;
  errorMessage = '';
  initialized = false;
  isEditMode = false;
  appointmentId: number | null = null;
  loading = false;

  patientSearchQuery = '';
  patientResults: Patient[] = [];
  selectedPatient: Patient | null = null;
  searchingPatient = false;

  doctors: User[] = [];
  loadingDoctors = false;

  constructor(
    private fb: FormBuilder,
    private appointmentService: AppointmentService,
    private patientService: PatientService,
    private userService: UserService,
    private dataRefresh: DataRefreshService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.appointmentForm = this.fb.group({
      patientId: [null, Validators.required],
      doctorId: [null, Validators.required],
      appointmentTime: ['', Validators.required],
      reasonForVisit: ['', [Validators.required, Validators.minLength(10)]],
      notes: ['']
    });

    this.loadingDoctors = true;
    this.userService.getDoctors().subscribe({
      next: (doctors) => {
        this.doctors = doctors;
        this.loadingDoctors = false;
        this.cdr.detectChanges();
      },
      error: () => { this.loadingDoctors = false; this.cdr.detectChanges(); }
    });

    // Check if we're in edit mode
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.appointmentId = +params['id'];
        this.loadAppointment(this.appointmentId);
      } else {
        // Check for patientId query param (for new appointments)
        const patientId = this.route.snapshot.queryParamMap.get('patientId');
        if (patientId) {
          this.patientService.getPatientById(Number(patientId)).subscribe({
            next: (patient: Patient) => {
              this.selectedPatient = patient;
              this.appointmentForm.patchValue({ patientId: patient.id });
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
    });
  }

  loadAppointment(id: number): void {
    this.loading = true;
    this.appointmentService.getAppointmentById(id).subscribe({
      next: (appointment) => {
        // Load patient details
        this.patientService.getPatientById(appointment.patientId).subscribe({
          next: (patient: Patient) => {
            this.selectedPatient = patient;
            
            // Format datetime for input
            const appointmentDate = new Date(appointment.appointmentTime);
            const formattedDateTime = appointmentDate.toISOString().slice(0, 16);
            
            this.appointmentForm.patchValue({
              patientId: appointment.patientId,
              doctorId: appointment.doctorId,
              appointmentTime: formattedDateTime,
              reasonForVisit: appointment.reasonForVisit,
              notes: appointment.notes
            });
            
            this.loading = false;
            this.initialized = true;
            this.cdr.detectChanges();
          },
          error: () => {
            this.loading = false;
            this.initialized = true;
            this.errorMessage = 'Failed to load patient details';
            this.cdr.detectChanges();
          }
        });
      },
      error: () => {
        this.loading = false;
        this.initialized = true;
        this.errorMessage = 'Failed to load appointment details';
        this.cdr.detectChanges();
      }
    });
  }

  searchPatient(): void {
    if (!this.patientSearchQuery.trim()) {
      this.patientResults = [];
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
    this.appointmentForm.patchValue({ patientId: patient.id });
    this.patientResults = [];
    this.patientSearchQuery = '';
  }

  clearPatient(): void {
    this.selectedPatient = null;
    this.appointmentForm.patchValue({ patientId: null });
  }

  onSubmit(): void {
    if (this.appointmentForm.invalid) {
      this.appointmentForm.markAllAsTouched();
      return;
    }

    const appointmentTime = new Date(this.appointmentForm.value.appointmentTime);
    if (appointmentTime < new Date()) {
      this.errorMessage = 'Appointment cannot be booked for a past date or time. Please select a valid future time.';
      this.cdr.detectChanges();
      return;
    }

    this.submitting = true;
    this.errorMessage = '';

    const request = this.appointmentForm.value;

    if (this.isEditMode && this.appointmentId) {
      this.appointmentService.updateAppointment(this.appointmentId, request).subscribe({
        next: () => {
          this.submitting = false;
          this.dataRefresh.triggerRefresh('appointments');
          this.dataRefresh.triggerRefresh('dashboard');
          this.router.navigate(['/appointments']);
        },
        error: (err: { error?: { message?: string } }) => {
          this.submitting = false;
          this.errorMessage = err.error?.message || 'Failed to update appointment';
          this.cdr.detectChanges();
        }
      });
    } else {
      this.appointmentService.createAppointment(request).subscribe({
        next: () => {
          this.submitting = false;
          this.dataRefresh.triggerRefresh('appointments');
          this.dataRefresh.triggerRefresh('dashboard');
          this.router.navigate(['/appointments']);
        },
        error: (err: { error?: { message?: string } }) => {
          this.submitting = false;
          this.errorMessage = err.error?.message || 'Failed to book appointment';
          this.cdr.detectChanges();
        }
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/appointments']);
  }

  isInvalid(field: string): boolean {
    const control = this.appointmentForm.get(field);
    return !!control && control.invalid && control.touched;
  }
}
