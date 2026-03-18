import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { PatientService } from '../../../core/services/patient.service';
import { AppointmentService } from '../../../core/services/appointment.service';
import { EncounterService } from '../../../core/services/encounter.service';
import { EpisodeService } from '../../../core/services/episode.service';
import { DataRefreshService } from '../../../core/services/data-refresh.service';
import { Patient, Appointment, Encounter, Episode } from '../../../core/models/hms.model';

@Component({
  selector: 'app-patient-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './patient-profile.component.html',
  styleUrl: './patient-profile.component.scss'
})
export class PatientProfileComponent implements OnInit, OnDestroy {
  patient: Patient | null = null;
  appointments: Appointment[] = [];
  encounters: Encounter[] = [];
  episodes: Episode[] = [];
  loading = true;
  activeTab = 'info';

  private refreshSub!: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private patientService: PatientService,
    private appointmentService: AppointmentService,
    private encounterService: EncounterService,
    private episodeService: EpisodeService,
    private dataRefresh: DataRefreshService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.loadPatient(id);

      this.refreshSub = this.dataRefresh.onRefresh('appointments', 'encounters', 'episodes').subscribe(() => {
        this.loadRelatedData(id);
      });
    }
  }

  ngOnDestroy(): void {
    this.refreshSub?.unsubscribe();
  }

  loadPatient(id: number): void {
    this.patientService.getPatientById(id).subscribe({
      next: (patient: Patient) => {
        this.patient = patient;
        this.loading = false;
        this.loadRelatedData(id);
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadRelatedData(patientId: number): void {
    this.appointmentService.getAppointmentsByPatient(patientId).subscribe({
      next: (data: Appointment[]) => { this.appointments = data; this.cdr.detectChanges(); }
    });
    this.encounterService.getEncountersByPatient(patientId).subscribe({
      next: (data: Encounter[]) => { this.encounters = data; this.cdr.detectChanges(); }
    });
    this.episodeService.getEpisodesByPatient(patientId).subscribe({
      next: (data: Episode[]) => { this.episodes = data; this.cdr.detectChanges(); }
    });
  }

  setTab(tab: string): void {
    this.activeTab = tab;
  }

  bookAppointment(): void {
    this.router.navigate(['/appointments/new'], { queryParams: { patientId: this.patient?.id } });
  }

  checkIn(): void {
    this.router.navigate(['/encounters/checkin'], { queryParams: { patientId: this.patient?.id } });
  }

  goBack(): void {
    this.router.navigate(['/patients']);
  }
}
