import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, Subscription, debounceTime, distinctUntilChanged, switchMap, of } from 'rxjs';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { EpisodeService } from '../../core/services/episode.service';
import { EncounterService } from '../../core/services/encounter.service';
import { PatientService } from '../../core/services/patient.service';
import { AuthService } from '../../core/services/auth.service';
import { DataRefreshService } from '../../core/services/data-refresh.service';
import { Episode, Patient, EpisodeRequest, Encounter } from '../../core/models/hms.model';
import { Role } from '../../core/enums/role.enum';

@Component({
  selector: 'app-episode-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ToastModule],
  providers: [MessageService],
  templateUrl: './episode-list.component.html',
  styleUrl: './episode-list.component.scss'
})
export class EpisodeListComponent implements OnInit, OnDestroy {
  episodes: Episode[] = [];
  searchQuery = '';
  selectedPatient: Patient | null = null;
  searchResults: Patient[] = [];
  loading = false;
  searchingPatient = false;
  userRole: string | null = null;

  showCreateForm = false;
  showEditForm = false;
  editingEpisode: Episode | null = null;
  episodeForm!: FormGroup;
  editForm!: FormGroup;
  submitting = false;
  errorMessage = '';

  selectedEpisode: Episode | null = null;
  episodeEncounters: Encounter[] = [];
  loadingEncounters = false;

  private searchSubject = new Subject<string>();
  private searchSub!: Subscription;
  private refreshSub!: Subscription;

  constructor(
    private episodeService: EpisodeService,
    private encounterService: EncounterService,
    private patientService: PatientService,
    private authService: AuthService,
    private dataRefresh: DataRefreshService,
    private fb: FormBuilder,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.userRole = this.authService.getUserRole();

    this.episodeForm = this.fb.group({
      patientId: [null, Validators.required],
      episodeType: ['', Validators.required],
      description: ['', Validators.required],
      startDate: [''],
      startTime: [''],
      endDate: [''],
      endTime: ['']
    });

    this.editForm = this.fb.group({
      episodeType: ['', Validators.required],
      description: ['', Validators.required],
      severity: [''],
      notes: [''],
      diagnosisSummary: ['']
    });

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

    this.refreshSub = this.dataRefresh.onRefresh('episodes').subscribe(() => {
      if (this.selectedPatient) {
        this.loadEpisodes(this.selectedPatient.id);
      } else if (this.userRole === Role.DOCTOR) {
        this.loadDoctorEpisodes();
      }
    });

    // Doctors see their patients' episodes by default
    if (this.userRole === Role.DOCTOR) {
      this.loadDoctorEpisodes();
    }
  }

  ngOnDestroy(): void {
    this.searchSub?.unsubscribe();
    this.refreshSub?.unsubscribe();
  }

  loadDoctorEpisodes(): void {
    this.loading = true;
    this.episodeService.getDoctorEpisodes().subscribe({
      next: (data: Episode[]) => {
        this.episodes = data;
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
    this.episodeForm.patchValue({ patientId: patient.id });
    this.loadEpisodes(patient.id);
  }

  loadEpisodes(patientId: number): void {
    this.loading = true;
    this.episodeService.getEpisodesByPatient(patientId).subscribe({
      next: (data: Episode[]) => {
        this.episodes = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  clearPatient(): void {
    this.selectedPatient = null;
    this.episodes = [];
    this.showCreateForm = false;
    if (this.userRole === Role.DOCTOR) {
      this.loadDoctorEpisodes();
    }
  }

  toggleCreateForm(): void {
    this.showCreateForm = !this.showCreateForm;
    if (this.showCreateForm && this.selectedPatient) {
      this.episodeForm.patchValue({ patientId: this.selectedPatient.id });
    }
  }

  createEpisode(): void {
    if (this.episodeForm.invalid || this.submitting) {
      this.episodeForm.markAllAsTouched();
      return;
    }

    this.submitting = true;
    this.errorMessage = '';

    this.episodeService.createEpisode(this.episodeForm.value).subscribe({
      next: () => {
        this.submitting = false;
        this.showCreateForm = false;
        this.episodeForm.patchValue({ episodeType: '', description: '' });
        this.dataRefresh.triggerRefresh('episodes');
        this.dataRefresh.triggerRefresh('dashboard');
        this.cdr.detectChanges();
      },
      error: (err: { error?: { message?: string } }) => {
        this.submitting = false;
        this.errorMessage = err.error?.message || 'Failed to create episode';
        this.cdr.detectChanges();
      }
    });
  }

  openEditForm(episode: Episode): void {
    this.editingEpisode = episode;
    this.editForm.patchValue({
      episodeType: episode.episodeType,
      description: episode.description,
      severity: episode.severity || '',
      notes: episode.notes || '',
      diagnosisSummary: episode.diagnosisSummary || ''
    });
    this.showEditForm = true;
  }

  cancelEdit(): void {
    this.showEditForm = false;
    this.editingEpisode = null;
  }

  saveEdit(): void {
    if (this.editForm.invalid || !this.editingEpisode) return;
    const request: EpisodeRequest = {
      patientId: this.editingEpisode.patientId,
      ...this.editForm.value
    };
    this.episodeService.updateEpisode(this.editingEpisode.id, request).subscribe({
      next: () => {
        this.showEditForm = false;
        this.editingEpisode = null;
        this.dataRefresh.triggerRefresh('episodes');
        this.messageService.add({ severity: 'success', summary: 'Updated', detail: 'Episode updated' });
        this.cdr.detectChanges();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update episode' });
        this.cdr.detectChanges();
      }
    });
  }

  closeEpisode(episode: Episode): void {
    this.episodeService.closeEpisode(episode.id).subscribe({
      next: () => {
        this.dataRefresh.triggerRefresh('episodes');
        this.dataRefresh.triggerRefresh('dashboard');
        this.cdr.detectChanges();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to close episode' });
        this.cdr.detectChanges();
      }
    });
  }

  deleteEpisode(episode: Episode): void {
    if (!confirm(`Delete episode "${episode.description}"?`)) return;
    this.episodeService.deleteEpisode(episode.id).subscribe({
      next: () => {
        this.dataRefresh.triggerRefresh('episodes');
        this.dataRefresh.triggerRefresh('dashboard');
        this.messageService.add({ severity: 'success', summary: 'Deleted', detail: 'Episode deleted' });
        this.cdr.detectChanges();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete episode' });
        this.cdr.detectChanges();
      }
    });
  }

  isInvalid(field: string): boolean {
    const control = this.episodeForm.get(field);
    return !!control && control.invalid && control.touched;
  }

  viewEpisodeEncounters(episode: Episode): void {
    this.selectedEpisode = episode;
    this.loadingEncounters = true;
    this.encounterService.getEncountersByEpisode(episode.id).subscribe({
      next: (encounters: Encounter[]) => {
        this.episodeEncounters = encounters;
        this.loadingEncounters = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingEncounters = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load encounters' });
        this.cdr.detectChanges();
      }
    });
  }

  closeEncountersView(): void {
    this.selectedEpisode = null;
    this.episodeEncounters = [];
  }

  formatDateTime(dateStr: string | null | undefined): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }
}
