import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
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

  constructor(
    private fb: FormBuilder,
    private patientService: PatientService,
    private dataRefresh: DataRefreshService,
    private router: Router
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
  }

  onSubmit(): void {
    if (this.patientForm.invalid || this.submitting) {
      this.patientForm.markAllAsTouched();
      return;
    }

    this.submitting = true;
    this.errorMessage = '';

    this.patientService.createPatient(this.patientForm.value).subscribe({
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

  goBack(): void {
    this.router.navigate(['/patients']);
  }

  isInvalid(field: string): boolean {
    const control = this.patientForm.get(field);
    return !!control && control.invalid && control.touched;
  }
}
