import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { PatientService } from '../../../core/services/patient.service';
import { DataRefreshService } from '../../../core/services/data-refresh.service';
import { Patient } from '../../../core/models/hms.model';

@Component({
  selector: 'app-patient-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './patient-form.component.html',
  styleUrl: './patient-form.component.scss'
})
export class PatientFormComponent implements OnInit {
  patientForm!: FormGroup;
  submitting = false;
  errorMessage = '';
  isEditMode = false;
  patientId: number | null = null;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private patientService: PatientService,
    private dataRefresh: DataRefreshService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr :ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.patientForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      gender: ['', Validators.required],
      dob: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      email: ['', [Validators.email]],
      address: [''],
      bloodGroup: [''],
      emergencyContact: ['', Validators.pattern('^[0-9]{10}$')]
    });

    // Check if we're in edit mode
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.patientId = +params['id'];
        this.loadPatient(this.patientId);
      }
    });
  }

  loadPatient(id: number): void {
    this.loading = true;
    this.patientService.getPatientById(id).subscribe({
      next: (patient: Patient) => {
        this.patientForm.patchValue({
          firstName: patient.firstName,
          lastName: patient.lastName,
          gender: patient.gender,
          dob: patient.dob,
          phone: patient.phone,
          email: patient.email,
          address: patient.address,
          bloodGroup: patient.bloodGroup,
          emergencyContact: patient.emergencyContact
        });
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'Failed to load patient details';
      }
    });
  }

  onSubmit(): void {
    if (this.patientForm.invalid || this.submitting) {
      this.patientForm.markAllAsTouched();
      return;
    }

    this.submitting = true;
    this.errorMessage = '';

    const request = this.patientForm.value;

    if (this.isEditMode && this.patientId) {
      this.patientService.updatePatient(this.patientId, request).subscribe({
        next: (patient: Patient) => {
          this.submitting = false;
          this.dataRefresh.triggerRefresh('patients');
          this.dataRefresh.triggerRefresh('dashboard');
          this.router.navigate(['/patients', patient.id]);
        },
        error: (err: { status?: number; error?: { message?: string } }) => {
          this.submitting = false;
          if (err.status === 409) {
            this.errorMessage = err.error?.message || 'A patient with this phone number already exists';
          } else {
            this.errorMessage = err.error?.message || 'Failed to update patient';
          }
        }
      });
    } else {
      this.patientService.createPatient(request).subscribe({
        next: (patient: Patient) => {
          this.submitting = false;
          this.dataRefresh.triggerRefresh('patients');
          this.dataRefresh.triggerRefresh('dashboard');
          this.router.navigate(['/patients', patient.id]);
        },
        error: (err: { status?: number; error?: { message?: string } }) => {
          this.submitting = false;
          if (err.status === 409) {
            this.errorMessage = err.error?.message || 'A patient with this phone number already exists';
          } else {
            this.errorMessage = err.error?.message || 'Failed to register patient';
          }
        }
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/patients']);
  }

  isInvalid(field: string): boolean {
    const control = this.patientForm.get(field);
    return !!control && control.invalid && control.touched;
  }
}
