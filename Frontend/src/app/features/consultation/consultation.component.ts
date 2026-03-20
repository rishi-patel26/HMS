import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { Subject, forkJoin, takeUntil } from 'rxjs';
import { EncounterService } from '@core/services/encounter.service';
import { ConsultationService } from '@core/services/consultation.service';
import { EpisodeService } from '@core/services/episode.service';
import { ServiceCatalogService } from '@core/services/service-catalog.service';
import { PatientService } from '@core/services/patient.service';
import { AuthService } from '@core/services/auth.service';
import { Role } from '@core/enums/role.enum';
import { Encounter, Consultation, ConsultationRequest, Patient, Episode, EpisodeRequest, ServiceCatalogItem } from '@core/models/hms.model';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-consultation',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ToastModule],
  providers: [MessageService],
  templateUrl: './consultation.component.html',
  styleUrl: './consultation.component.scss'
})
export class ConsultationComponent implements OnInit, OnDestroy {
  encounters: Encounter[] = [];
  loadingQueue = false;
  errorMessage = '';

  consultationHistory: Consultation[] = [];
  searchQuery = '';
  viewMode: 'queue' | 'consultation' | 'history' = 'queue';

  encounter: Encounter | null = null;
  patient: Patient | null = null;
  episodes: Episode[] = [];
  existingConsultation: Consultation | null = null;
  patientConsultationHistory: Consultation[] = [];
  saving = false;
  loadingConsultation = false;
  loadingHistory = false;

  userRole: string | null = null;
  showEpisodeForm = false;
  episodeSubmitting = false;
  episodeError = '';
  changingEpisode = false;
  episodeForm: FormGroup;

  consultationForm: FormGroup;

  private readonly destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private encounterService: EncounterService,
    private consultationService: ConsultationService,
    private patientService: PatientService,
    private episodeService: EpisodeService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef,
    private authService: AuthService
  ) {
    this.episodeForm = this.fb.group({
      episodeType: ['', Validators.required],
      description: ['', Validators.required]
    });
    this.consultationForm = this.fb.group({
      symptoms: [''],
      diagnosis: ['', Validators.required],
      prescription: ['', Validators.required],
      doctorNotes: [''],
      followupDate: [''],
      testsRequested: ['']
    });
  }

  ngOnInit(): void {
    this.userRole = this.authService.getUserRole();
    const idParam = this.route.snapshot.paramMap.get('encounterId');
    if (idParam) {
      this.loadEncounter(+idParam);
    } else {
      this.loadTodayEncounters();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }


  loadTodayEncounters(): void {
    this.loadingQueue = true;
    this.errorMessage = '';
    const obs = this.userRole === Role.DOCTOR
      ? this.encounterService.getDoctorTodayEncounters()
      : this.encounterService.getTodayEncounters();
    obs.pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => {
        this.encounters = data;
        this.loadingQueue = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = 'Failed to load today\'s encounters.';
        this.loadingQueue = false;
        this.cdr.detectChanges();
      }
    });
  }

  selectEncounter(enc: Encounter): void {
    this.loadEncounter(enc.id);
  }

  backToQueue(): void {
    this.encounter = null;
    this.patient = null;
    this.episodes = [];
    this.existingConsultation = null;
    this.consultationForm.reset();
    this.episodeForm.reset();
    this.showEpisodeForm = false;
    this.episodeError = '';
    this.errorMessage = '';
    this.loadTodayEncounters();
  }


  loadEncounter(encounterId: number): void {
    this.loadingConsultation = true;
    this.errorMessage = '';

    this.encounterService.getEncounterById(encounterId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (encounter) => {
        this.encounter = encounter;
        this.loadingConsultation = false;
        this.cdr.detectChanges();

        forkJoin({
          patient: this.patientService.getPatientById(encounter.patientId),
          episodes: this.episodeService.getEpisodesByPatient(encounter.patientId)
        }).pipe(takeUntil(this.destroy$)).subscribe({
          next: (results) => {
            this.patient = results.patient;
            this.episodes = results.episodes;
            this.cdr.detectChanges();
            this.loadingHistory = true;
            this.consultationService.searchConsultations({ patientId: encounter.patientId })
              .pipe(takeUntil(this.destroy$)).subscribe({
              next: (history) => {
                this.patientConsultationHistory = history;
                this.loadingHistory = false;
                this.cdr.detectChanges();
              },
              error: () => { this.loadingHistory = false; this.cdr.detectChanges(); }
            });
          },
          error: () => {
            this.messageService.add({ severity: 'warn', summary: 'Warning', detail: 'Some details could not be loaded' });
            this.cdr.detectChanges();
          }
        });

        this.consultationService.getConsultationByEncounter(encounter.id)
          .pipe(takeUntil(this.destroy$)).subscribe({
          next: (consultation) => {
            this.existingConsultation = consultation;
            this.consultationForm.patchValue({
              symptoms: consultation.symptoms,
              diagnosis: consultation.diagnosis,
              prescription: consultation.prescription,
              doctorNotes: consultation.doctorNotes,
              followupDate: consultation.followupDate,
              testsRequested: consultation.testsRequested
            });
            this.cdr.detectChanges();
          },
          error: () => {
          }
        });
      },
      error: () => {
        this.loadingConsultation = false;
        this.errorMessage = 'Encounter not found.';
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Encounter not found' });
        this.cdr.detectChanges();
      }
    });
  }

  saveConsultation(): void {
    if (this.consultationForm.invalid || !this.encounter) return;

    const isUpdate = !!this.existingConsultation;
    this.saving = true;
    const request: ConsultationRequest = {
      encounterId: this.encounter.id,
      ...this.consultationForm.value
    };

    const obs = isUpdate
      ? this.consultationService.updateConsultation(this.existingConsultation!.id, request)
      : this.consultationService.createConsultation(request);

    obs.pipe(takeUntil(this.destroy$)).subscribe({
      next: (consultation) => {
        this.existingConsultation = consultation;
        this.saving = false;
        this.messageService.add({
          severity: 'success', summary: 'Success',
          detail: isUpdate ? 'Consultation updated' : 'Consultation saved'
        });
        this.cdr.detectChanges();
      },
      error: () => {
        this.saving = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to save consultation' });
        this.cdr.detectChanges();
      }
    });
  }

  completeConsultation(): void {
    if (!this.existingConsultation) return;

    this.saving = true;
    this.consultationService.completeConsultation(this.existingConsultation.id)
      .pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.saving = false;
        this.messageService.add({
          severity: 'success', summary: 'Success', detail: 'Consultation completed. Encounter marked as completed.'
        });
        this.cdr.detectChanges();
      },
      error: () => {
        this.saving = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to complete consultation' });
      }
    });
    this.cdr.detectChanges();
  }

  searchConsultations(): void {
    if (!this.searchQuery.trim()) return;
    this.loadingQueue = true;
    this.consultationService.searchConsultations({ patientName: this.searchQuery }).subscribe({
      next: (results) => {
        this.consultationHistory = results;
        this.loadingQueue = false;
        this.cdr.detectChanges();
      },
      error: () => { this.loadingQueue = false; this.cdr.detectChanges(); }
    });
  }

  /** Open consultation by navigating to its encounter */
  selectConsultation(consultation: Consultation): void {
    if (consultation.encounterId) {
      this.loadEncounter(consultation.encounterId);
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'WAITING': return 'status-waiting';
      case 'IN_CONSULTATION': return 'status-in-consultation';
      case 'COMPLETED': return 'status-completed';
      case 'CANCELLED': return 'status-cancelled';
      default: return '';
    }
  }

  createEpisodeFromEncounter(): void {
    if (this.episodeForm.invalid || !this.encounter) return;
    this.episodeSubmitting = true;
    this.episodeError = '';
    const request: EpisodeRequest = {
      patientId: this.encounter.patientId,
      ...this.episodeForm.value
    };
    this.episodeService.createEpisode(request).subscribe({
      next: (episode: Episode) => {
        this.encounterService.linkEpisodeToEncounter(this.encounter!.id, episode.id)
          .pipe(takeUntil(this.destroy$)).subscribe({
            next: (updated) => {
              this.encounter = updated;
              this.episodes = [...this.episodes, episode];
              this.showEpisodeForm = false;
              this.episodeForm.reset();
              this.episodeSubmitting = false;
              this.cdr.detectChanges();
            },
            error: () => {
              this.episodeSubmitting = false;
              this.episodeError = 'Failed to link episode to encounter';
              this.cdr.detectChanges();
            }
          });
      },
      error: () => {
        this.episodeSubmitting = false;
        this.episodeError = 'Failed to create episode';
        this.cdr.detectChanges();
      }
    });
  }

  linkExistingEpisode(episodeId: number): void {
    if (!this.encounter) return;
    this.encounterService.linkEpisodeToEncounter(this.encounter.id, episodeId)
      .pipe(takeUntil(this.destroy$)).subscribe({
        next: (updated) => {
          this.encounter = updated;
          this.cdr.detectChanges();
        },
        error: () => {}
      });
  }
}
