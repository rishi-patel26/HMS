import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NurseService } from '@core/services/nurse.service';
import { BedManagementService } from '@core/services/bed-management.service';
import {
  BedAllocationPriority,
  BedAllocationRequestItem,
  BedAssignmentItem,
  BedEventItem,
  BedType,
  CreateBedAllocationRequest,
  PatientCaseTimeline,
  WardItem
} from '@core/models/hms.model';

@Component({
  selector: 'app-patient-case',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="page">
      <!-- Back button -->
      <a routerLink="/nurse/doctor-patients" class="back-link">
        <i class="pi pi-arrow-left"></i> Back to Doctor's Patients
      </a>

      <div class="loading-state" *ngIf="loading">
        <i class="pi pi-spin pi-spinner"></i>
        <span>Loading patient case...</span>
      </div>

      <div class="error-state" *ngIf="errorMessage">
        <i class="pi pi-exclamation-triangle"></i>
        <span>{{ errorMessage }}</span>
      </div>

      <div *ngIf="caseData && !loading">
        <!-- Patient header -->
        <div class="patient-header-card">
          <div class="patient-info-row">
            <div class="patient-avatar">
              <i class="pi pi-user"></i>
            </div>
            <div class="patient-details">
              <h2>{{ caseData.patientName }}</h2>
              <div class="patient-meta">
                <span class="meta-item"><i class="pi pi-id-card"></i> {{ caseData.patientUhid }}</span>
                <span class="meta-item" *ngIf="caseData.gender"><i class="pi pi-user"></i> {{ caseData.gender }}</span>
                <span class="meta-item" *ngIf="caseData.dob"><i class="pi pi-calendar"></i> {{ caseData.dob }}</span>
                <span class="meta-item" *ngIf="caseData.phone"><i class="pi pi-phone"></i> {{ caseData.phone }}</span>
                <span class="meta-item" *ngIf="caseData.bloodGroup"><i class="pi pi-heart"></i> {{ caseData.bloodGroup }}</span>
              </div>
              <div class="allergy-warning" *ngIf="caseData.allergies">
                <i class="pi pi-exclamation-triangle"></i> Allergies: {{ caseData.allergies }}
              </div>
            </div>
          </div>
        </div>

        <!-- Encounter info card -->
        <div class="section-card">
          <div class="section-title">
            <i class="pi pi-file" style="color: #4f46e5;"></i>
            <h3>Encounter Details</h3>
            <span class="status-badge" [class]="'badge-' + caseData.encounterStatus.toLowerCase()">
              {{ formatStatus(caseData.encounterStatus) }}
            </span>
          </div>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Encounter #</span>
              <span class="info-value">{{ caseData.encounterNumber }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Doctor</span>
              <span class="info-value">Dr. {{ caseData.doctorName }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Visit Type</span>
              <span class="visit-badge" [class]="'visit-' + caseData.visitType.toLowerCase()">{{ caseData.visitType }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Priority</span>
              <span class="priority-badge" [class]="'priority-' + caseData.priority.toLowerCase()">{{ caseData.priority }}</span>
            </div>
            <div class="info-item" *ngIf="caseData.visitDate">
              <span class="info-label">Visit Date</span>
              <span class="info-value">{{ formatDateTime(caseData.visitDate) }}</span>
            </div>
            <div class="info-item" *ngIf="caseData.checkinTime">
              <span class="info-label">Check-in Time</span>
              <span class="info-value">{{ formatDateTime(caseData.checkinTime) }}</span>
            </div>
            <div class="info-item" *ngIf="caseData.roomNumber">
              <span class="info-label">Room</span>
              <span class="info-value">{{ caseData.roomNumber }}</span>
            </div>
          </div>
          <div class="encounter-notes" *ngIf="caseData.encounterNotes">
            <span class="info-label">Notes</span>
            <p>{{ caseData.encounterNotes }}</p>
          </div>
        </div>

        <!-- Consultation Timeline -->
        <div class="section-card" *ngIf="caseData.consultationId">
          <div class="section-title">
            <i class="pi pi-file-edit" style="color: #059669;"></i>
            <h3>Consultation</h3>
            <span class="time-label" *ngIf="caseData.consultationCreatedAt">{{ formatDateTime(caseData.consultationCreatedAt) }}</span>
          </div>
          <div class="timeline">
            <div class="timeline-item" *ngIf="caseData.symptoms">
              <div class="timeline-marker symptoms"></div>
              <div class="timeline-content">
                <h4>Symptoms</h4>
                <p>{{ caseData.symptoms }}</p>
              </div>
            </div>
            <div class="timeline-item" *ngIf="caseData.diagnosis">
              <div class="timeline-marker diagnosis"></div>
              <div class="timeline-content">
                <h4>Diagnosis</h4>
                <p>{{ caseData.diagnosis }}</p>
              </div>
            </div>
            <div class="timeline-item" *ngIf="caseData.prescription">
              <div class="timeline-marker prescription"></div>
              <div class="timeline-content">
                <h4>Prescription</h4>
                <p>{{ caseData.prescription }}</p>
              </div>
            </div>
            <div class="timeline-item" *ngIf="caseData.doctorNotes">
              <div class="timeline-marker notes"></div>
              <div class="timeline-content">
                <h4>Doctor Notes</h4>
                <p>{{ caseData.doctorNotes }}</p>
              </div>
            </div>
            <div class="timeline-item" *ngIf="caseData.testsRequested">
              <div class="timeline-marker tests"></div>
              <div class="timeline-content">
                <h4>Tests Requested</h4>
                <p>{{ caseData.testsRequested }}</p>
              </div>
            </div>
            <div class="timeline-item" *ngIf="caseData.followupDate">
              <div class="timeline-marker followup"></div>
              <div class="timeline-content">
                <h4>Follow-up Date</h4>
                <p>{{ caseData.followupDate }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- No consultation yet -->
        <div class="section-card no-consultation" *ngIf="!caseData.consultationId">
          <div class="section-title">
            <i class="pi pi-info-circle" style="color: #94a3b8;"></i>
            <h3>Consultation</h3>
          </div>
          <p class="empty-text">No consultation recorded for this encounter yet.</p>
        </div>

        <!-- Bed Management Section -->
        <div class="section-card">
          <div class="section-title">
            <i class="pi pi-building" style="color: #4338ca;"></i>
            <h3>Bed Allocation Requests</h3>
            <button class="raise-btn" (click)="showBedRequestForm = !showBedRequestForm"
                    *ngIf="!showBedRequestForm">
              <i class="pi pi-plus"></i> Raise Request
            </button>
          </div>

          <div class="allocation-summary" *ngIf="getEncounterAssignment() as asg">
            <span class="summary-label">Current Bed</span>
            <strong>{{ asg.bedNumber }} ({{ asg.wardName }})</strong>
            <span class="summary-status">{{ asg.status }}</span>
          </div>

          <!-- Bed request form -->
          <div class="bed-request-form" *ngIf="showBedRequestForm">
            <div class="form-group">
              <label>Required Bed Type *</label>
              <select [(ngModel)]="requiredBedType">
                <option value="GENERAL">GENERAL</option>
                <option value="ICU">ICU</option>
                <option value="PRIVATE">PRIVATE</option>
              </select>
            </div>
            <div class="form-group">
              <label>Priority *</label>
              <select [(ngModel)]="requestPriority">
                <option value="NORMAL">NORMAL</option>
                <option value="URGENT">URGENT</option>
                <option value="EMERGENCY">EMERGENCY</option>
              </select>
            </div>
            <div class="form-group">
              <label>Preferred Ward</label>
              <select [(ngModel)]="preferredWardId">
                <option [ngValue]="null">No preference</option>
                <option *ngFor="let ward of wards" [ngValue]="ward.id">
                  {{ ward.type }}
                </option>
              </select>
            </div>
            <div class="form-group">
              <label>Clinical Notes</label>
              <textarea [(ngModel)]="bedRequestNotes" rows="3" placeholder="Add short clinical reason and context"></textarea>
            </div>
            <div class="form-actions">
              <button class="submit-btn" (click)="submitBedRequest()">
                Submit Request
              </button>
              <button class="cancel-btn" (click)="showBedRequestForm = false">Cancel</button>
            </div>
            <div class="form-error" *ngIf="bedRequestError">{{ bedRequestError }}</div>
            <div class="form-success" *ngIf="bedRequestSuccess">{{ bedRequestSuccess }}</div>
          </div>

          <!-- Existing bed requests -->
          <div *ngIf="bedRequests.length > 0" class="bed-requests-list">
            <div class="bed-request-item" *ngFor="let br of bedRequests">
              <div class="br-header">
                <span class="br-status" [class]="'br-' + br.status.toLowerCase()">{{ br.status }}</span>
                <span class="br-date">{{ formatDateTime(br.createdAt) }}</span>
              </div>
              <div class="br-body">
                <div class="br-detail"><span class="br-label">Bed Type:</span> {{ br.requiredBedType }}</div>
                <div class="br-detail"><span class="br-label">Priority:</span> {{ br.priority }}</div>
                <div class="br-detail" *ngIf="br.preferredWardName"><span class="br-label">Preferred Ward:</span> {{ br.preferredWardName }}</div>
                <div class="br-detail" *ngIf="br.notes"><span class="br-label">Notes:</span> {{ br.notes }}</div>
                <div class="br-detail" *ngIf="br.status === 'ALLOCATED' && getEncounterAssignment() as asg">
                  <span class="br-label">Allocated Bed:</span> {{ asg.bedNumber }} ({{ asg.wardName }})
                </div>
                <div class="br-detail">
                  <button class="timeline-btn" (click)="toggleTimeline(br)">
                    {{ selectedRequestId === br.id ? 'Hide Timeline' : 'View Timeline' }}
                  </button>
                </div>
                <div class="timeline-events" *ngIf="selectedRequestId === br.id">
                  <div class="timeline-event" *ngFor="let evt of selectedTimeline">
                    <span class="evt-type">{{ formatEventType(evt.eventType) }}</span>
                    <span class="evt-meta">{{ formatDateTime(evt.timestamp) }} by {{ evt.performedByName || 'System' }}</span>
                    <span class="evt-notes" *ngIf="evt.notes">{{ evt.notes }}</span>
                  </div>
                  <p class="empty-text" *ngIf="selectedTimeline.length === 0">No events yet.</p>
                </div>
              </div>
            </div>
          </div>
          <p class="empty-text" *ngIf="bedRequests.length === 0 && !showBedRequestForm">No bed requests for this encounter.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { }
    .back-link {
      display: inline-flex; align-items: center; gap: 0.4rem; color: #4f46e5; font-size: 0.85rem;
      text-decoration: none; margin-bottom: 1.25rem; font-weight: 500;
      &:hover { color: #4338ca; text-decoration: underline; }
    }
    .loading-state, .error-state {
      background: white; border-radius: 12px; padding: 2rem; box-shadow: 0 1px 3px rgba(0,0,0,0.08);
      display: flex; align-items: center; justify-content: center; gap: 0.75rem;
      color: #64748b; font-size: 0.95rem;
      i { font-size: 1.5rem; }
    }
    .error-state { color: #dc2626; i { color: #dc2626; } }

    .patient-header-card {
      background: white; border-radius: 12px; padding: 1.25rem; margin-bottom: 1rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    }
    .patient-info-row { display: flex; align-items: flex-start; gap: 1rem; }
    .patient-avatar {
      width: 56px; height: 56px; border-radius: 50%; background: #e0e7ff;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      i { font-size: 1.5rem; color: #4f46e5; }
    }
    .patient-details {
      h2 { margin: 0 0 0.35rem 0; font-size: 1.25rem; font-weight: 700; color: #1e293b; }
    }
    .patient-meta { display: flex; flex-wrap: wrap; gap: 1rem; }
    .meta-item {
      font-size: 0.82rem; color: #64748b; display: flex; align-items: center; gap: 0.3rem;
      i { font-size: 0.75rem; }
    }
    .allergy-warning {
      margin-top: 0.5rem; background: #fef2f2; color: #dc2626; padding: 0.4rem 0.75rem;
      border-radius: 8px; font-size: 0.82rem; display: inline-flex; align-items: center; gap: 0.4rem;
      i { font-size: 0.8rem; }
    }

    .section-card {
      background: white; border-radius: 12px; padding: 1.25rem; margin-bottom: 1rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    }
    .section-title {
      display: flex; align-items: center; gap: 0.6rem; margin-bottom: 1rem;
      i { font-size: 1.1rem; }
      h3 { margin: 0; font-size: 1rem; font-weight: 700; color: #1e293b; flex: 1; }
    }
    .time-label { font-size: 0.75rem; color: #94a3b8; }
    .status-badge {
      font-size: 0.7rem; font-weight: 600; padding: 0.2rem 0.6rem; border-radius: 20px;
      text-transform: uppercase; letter-spacing: 0.03em;
    }
    .badge-waiting { background: #fef3c7; color: #92400e; }
    .badge-in_consultation { background: #dbeafe; color: #1e40af; }
    .badge-completed { background: #d1fae5; color: #065f46; }
    .badge-cancelled { background: #fee2e2; color: #991b1b; }

    .info-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 0.75rem;
    }
    .info-item { display: flex; flex-direction: column; gap: 0.2rem; }
    .info-label { font-size: 0.75rem; color: #94a3b8; font-weight: 500; }
    .info-value { font-size: 0.88rem; color: #334155; font-weight: 500; }
    .visit-badge, .priority-badge {
      font-size: 0.7rem; font-weight: 600; padding: 0.15rem 0.5rem; border-radius: 6px; display: inline-block; width: fit-content;
    }
    .visit-opd { background: #e0e7ff; color: #3730a3; }
    .visit-ipd { background: #fce7f3; color: #9d174d; }
    .priority-normal { background: #d1fae5; color: #065f46; }
    .priority-urgent { background: #fef3c7; color: #92400e; }
    .priority-emergency { background: #fee2e2; color: #991b1b; }
    .encounter-notes {
      margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid #f1f5f9;
      p { margin: 0.25rem 0 0 0; color: #475569; font-size: 0.88rem; }
    }

    /* Timeline */
    .timeline { padding-left: 1.25rem; border-left: 2px solid #e2e8f0; }
    .timeline-item {
      position: relative; padding: 0 0 1.25rem 1.25rem;
      &:last-child { padding-bottom: 0; }
    }
    .timeline-marker {
      position: absolute; left: -1.35rem; top: 0.15rem;
      width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;
    }
    .timeline-marker.symptoms { background: #f59e0b; }
    .timeline-marker.diagnosis { background: #ef4444; }
    .timeline-marker.prescription { background: #3b82f6; }
    .timeline-marker.notes { background: #8b5cf6; }
    .timeline-marker.tests { background: #06b6d4; }
    .timeline-marker.followup { background: #10b981; }
    .timeline-content {
      h4 { margin: 0 0 0.25rem 0; font-size: 0.82rem; font-weight: 600; color: #475569; text-transform: uppercase; letter-spacing: 0.04em; }
      p { margin: 0; font-size: 0.9rem; color: #1e293b; line-height: 1.5; white-space: pre-wrap; }
    }

    .no-consultation .empty-text, .empty-text { color: #94a3b8; font-size: 0.88rem; margin: 0; }

    .raise-btn {
      background: #4f46e5; color: white; border: none; border-radius: 8px;
      padding: 0.4rem 0.8rem; font-size: 0.78rem; cursor: pointer; font-weight: 600;
      display: flex; align-items: center; gap: 0.3rem;
      &:hover { background: #4338ca; }
    }

    .allocation-summary {
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      color: #065f46;
      border-radius: 8px;
      padding: 0.55rem 0.75rem;
      margin-bottom: 0.85rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
    .summary-label { font-size: 0.76rem; font-weight: 600; color: #047857; text-transform: uppercase; }
    .summary-status {
      margin-left: auto;
      background: #d1fae5;
      color: #065f46;
      border-radius: 20px;
      padding: 0.15rem 0.55rem;
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
    }

    .bed-request-form {
      background: #f8fafc; border-radius: 8px; padding: 1rem; margin-bottom: 1rem;
    }
    .form-group {
      margin-bottom: 0.75rem;
      label { display: block; font-size: 0.82rem; font-weight: 600; color: #475569; margin-bottom: 0.3rem; }
      textarea, input, select {
        width: 100%; padding: 0.5rem 0.65rem; border: 1.5px solid #e2e8f0; border-radius: 8px; background: white;
        font-size: 0.88rem; color: #1e293b; outline: none; box-sizing: border-box;
        &:focus { border-color: #4f46e5; }
      }
    }
    .form-actions { display: flex; gap: 0.5rem; justify-content: flex-end; }
    .submit-btn {
      background: #4f46e5; color: white; border: none; border-radius: 8px;
      padding: 0.45rem 1rem; font-size: 0.82rem; cursor: pointer; font-weight: 600;
      &:hover { background: #4338ca; }
      &:disabled { background: #a5b4fc; cursor: not-allowed; }
    }
    .cancel-btn {
      background: #e2e8f0; color: #475569; border: none; border-radius: 8px;
      padding: 0.45rem 1rem; font-size: 0.82rem; cursor: pointer; font-weight: 600;
      &:hover { background: #cbd5e1; }
    }
    .form-error { color: #dc2626; font-size: 0.82rem; margin-top: 0.5rem; }
    .form-success { color: #059669; font-size: 0.82rem; margin-top: 0.5rem; }

    .bed-requests-list { display: flex; flex-direction: column; gap: 1rem; }
    .bed-request-item { background: #f8fafc; border-radius: 8px; padding: 0.75rem 1rem; }
    .br-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem; }
    .br-status {
      font-size: 0.7rem; font-weight: 600; padding: 0.15rem 0.5rem; border-radius: 20px; text-transform: uppercase;
    }
    .br-requested { background: #fef3c7; color: #92400e; }
    .br-under_review { background: #dbeafe; color: #1e40af; }
    .br-allocated { background: #d1fae5; color: #065f46; }
    .br-rejected { background: #fee2e2; color: #991b1b; }
    .br-date { font-size: 0.75rem; color: #94a3b8; }
    .br-body { font-size: 0.85rem; color: #475569; }
    .br-detail { margin-bottom: 0.2rem; }
    .br-label { font-weight: 600; color: #475569; }
    .timeline-btn {
      margin-top: 0.35rem; background: #eef2ff; color: #3730a3; border: 1px solid #c7d2fe;
      border-radius: 8px; padding: 0.3rem 0.6rem; cursor: pointer; font-size: 0.75rem; font-weight: 600;
    }
    .timeline-events { margin-top: 0.6rem; border-top: 1px dashed #cbd5e1; padding-top: 0.55rem; }
    .timeline-event { display: flex; flex-direction: column; gap: 0.1rem; margin-bottom: 0.45rem; }
    .evt-type { font-size: 0.76rem; color: #334155; font-weight: 700; text-transform: uppercase; }
    .evt-meta { font-size: 0.73rem; color: #64748b; }
    .evt-notes { font-size: 0.78rem; color: #475569; }

    @media (max-width: 640px) {
      .info-grid { grid-template-columns: 1fr 1fr; }
      .patient-meta { gap: 0.5rem; }
    }
  `]
})
export class PatientCaseComponent implements OnInit {
  caseData: PatientCaseTimeline | null = null;
  bedRequests: BedAllocationRequestItem[] = [];
  activeAssignments: BedAssignmentItem[] = [];
  wards: WardItem[] = [];
  loading = false;
  errorMessage = '';
  encounterId!: number;
  selectedRequestId: number | null = null;
  selectedTimeline: BedEventItem[] = [];

  showBedRequestForm = false;
  requiredBedType: BedType = 'GENERAL';
  requestPriority: BedAllocationPriority = 'NORMAL';
  preferredWardId: number | null = null;
  bedRequestNotes = '';
  bedRequestError = '';
  bedRequestSuccess = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private nurseService: NurseService,
    private bedManagementService: BedManagementService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.encounterId = Number(this.route.snapshot.paramMap.get('encounterId'));
    if (!this.encounterId) {
      this.errorMessage = 'No encounter ID provided.';
      return;
    }
    this.loadCase();
    this.loadWards();
    this.loadBedRequests();
    this.loadActiveAssignments();
  }

  loadWards(): void {
    this.bedManagementService.getWardOccupancy().subscribe({
      next: (wards) => {
        this.wards = wards.filter(w => w.active);
        this.cdr.detectChanges();
      }
    });
  }

  loadCase(): void {
    this.loading = true;
    this.nurseService.getPatientCase(this.encounterId).subscribe({
      next: (data) => {
        this.caseData = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'Failed to load patient case.';
        this.cdr.detectChanges();
      }
    });
  }

  loadBedRequests(): void {
    this.bedManagementService.getRequestsByEncounter(this.encounterId).subscribe({
      next: (requests) => {
        this.bedRequests = requests;
        this.cdr.detectChanges();
      }
    });
  }

  loadActiveAssignments(): void {
    this.bedManagementService.getAssignmentsByStatus('ACTIVE').subscribe({
      next: (assignments) => {
        this.activeAssignments = assignments.filter(a => a.encounterId === this.encounterId);
        this.cdr.detectChanges();
      }
    });
  }

  getEncounterAssignment(): BedAssignmentItem | null {
    return this.activeAssignments[0] ?? null;
  }

  submitBedRequest(): void {
    if (!this.caseData) return;
    this.bedRequestError = '';
    this.bedRequestSuccess = '';

    const request: CreateBedAllocationRequest = {
      encounterId: this.encounterId,
      patientId: this.caseData.patientId,
      requiredBedType: this.requiredBedType,
      priority: this.requestPriority,
      preferredWardId: this.preferredWardId ?? undefined,
      notes: this.bedRequestNotes.trim()
    };

    this.bedManagementService.createAllocationRequest(request).subscribe({
      next: () => {
        this.bedRequestSuccess = 'Bed allocation request submitted successfully.';
        this.requiredBedType = 'GENERAL';
        this.requestPriority = 'NORMAL';
        this.preferredWardId = null;
        this.bedRequestNotes = '';
        this.showBedRequestForm = false;
        this.loadBedRequests();
        this.loadActiveAssignments();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.bedRequestError = err?.error?.message || 'Failed to submit bed request.';
        this.cdr.detectChanges();
      }
    });
  }

  toggleTimeline(request: BedAllocationRequestItem): void {
    if (this.selectedRequestId === request.id) {
      this.selectedRequestId = null;
      this.selectedTimeline = [];
      return;
    }

    this.selectedRequestId = request.id;
    this.selectedTimeline = [];
    this.bedManagementService.getRequestTimeline(request.id).subscribe({
      next: (events) => {
        this.selectedTimeline = events;
        this.cdr.detectChanges();
      }
    });
  }

  formatEventType(type: string): string {
    return type.replace(/_/g, ' ');
  }

  formatStatus(status: string): string {
    return status.replace(/_/g, ' ');
  }

  formatDateTime(dt: string): string {
    if (!dt) return '';
    const d = new Date(dt);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
      ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }
}
