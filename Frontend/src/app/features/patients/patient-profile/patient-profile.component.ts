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
  patientId!: number;
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
  ) { }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.patientId = id;
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

    // this.encounterService.getEncountersByPatient(patientId).subscribe({
    //   next: (data: Encounter[]) => { this.encounters = data; this.cdr.detectChanges(); }
    // });
    // this.episodeService.getEpisodesByPatient(patientId).subscribe({
    //   next: (data: Episode[]) => { this.episodes = data; this.cdr.detectChanges(); }
    // });
  }

  setTab(tab: string): void {
    this.activeTab = tab;

    if (tab === 'appointments' && this.appointments.length === 0) {
      this.appointmentService.getAppointmentsByPatient(this.patientId).subscribe({
        next: (data: Appointment[]) => { this.appointments = data; this.cdr.detectChanges(); }
      });
    }
    else if (tab === 'encounters' && this.encounters.length === 0) {
      this.encounterService.getEncountersByPatient(this.patientId).subscribe({
        next: (data: Encounter[]) => { this.encounters = data; this.cdr.detectChanges(); }
      });
    }
    else if (tab === 'episodes' && this.episodes.length === 0) {
      this.episodeService.getEpisodesByPatient(this.patientId).subscribe({
        next: (data: Episode[]) => { this.episodes = data; this.cdr.detectChanges(); }
      });
    }
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
