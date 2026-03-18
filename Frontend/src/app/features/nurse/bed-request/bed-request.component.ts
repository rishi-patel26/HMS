import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { BedManagementService } from '@core/services/bed-management.service';
import { BedAllocationRequestItem, BedEventItem } from '@core/models/hms.model';

@Component({
  selector: 'app-bed-request',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h1>My Bed Allocation Requests</h1>
        <p class="subtitle">Track requests, workflow status, and timeline events</p>
      </div>

      <div class="loading-state" *ngIf="loading">
        <i class="pi pi-spin pi-spinner"></i>
        <span>Loading bed requests...</span>
      </div>

      <div class="empty-state" *ngIf="!loading && requests.length === 0">
        <i class="pi pi-inbox"></i>
        <p>No bed requests found</p>
        <span class="hint">Raise requests from a patient's case view</span>
      </div>

      <div class="requests-list" *ngIf="requests.length > 0">
        <div class="request-card" *ngFor="let r of requests">
          <div class="card-top">
            <div class="card-patient">
              <span class="patient-name">{{ r.patientName }}</span>
              <span class="patient-uhid">{{ r.patientUhid }}</span>
            </div>
            <span class="status-badge" [class]="'status-' + r.status.toLowerCase()">{{ r.status }}</span>
          </div>
          <div class="card-details">
            <div class="detail-row">
              <span class="detail-label">Encounter</span>
              <span class="detail-value clickable" (click)="openCase(r.encounterId)">{{ r.encounterNumber }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Required Bed Type</span>
              <span class="detail-value">{{ r.requiredBedType }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Priority</span>
              <span class="detail-value">{{ r.priority }}</span>
            </div>
            <div class="detail-row" *ngIf="r.preferredWardName">
              <span class="detail-label">Preferred Ward</span>
              <span class="detail-value">{{ r.preferredWardName }}</span>
            </div>
            <div class="detail-row" *ngIf="r.notes">
              <span class="detail-label">Notes</span>
              <span class="detail-value">{{ r.notes }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Requested</span>
              <span class="detail-value">{{ formatDateTime(r.createdAt) }}</span>
            </div>
            <div class="detail-row">
              <button class="timeline-btn" (click)="toggleTimeline(r.id)">
                {{ selectedRequestId === r.id ? 'Hide Timeline' : 'View Timeline' }}
              </button>
            </div>
            <div class="timeline-events" *ngIf="selectedRequestId === r.id">
              <div class="timeline-event" *ngFor="let evt of selectedTimeline">
                <span class="evt-type">{{ formatEventType(evt.eventType) }}</span>
                <span class="evt-meta">{{ formatDateTime(evt.timestamp) }} by {{ evt.performedByName || 'System' }}</span>
                <span class="evt-notes" *ngIf="evt.notes">{{ evt.notes }}</span>
              </div>
              <p class="hint" *ngIf="selectedTimeline.length === 0">No timeline events found.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { }
    .page-header {
      margin-bottom: 1.5rem;
      h1 { font-size: 1.5rem; font-weight: 700; color: #1e293b; margin: 0 0 0.25rem 0; }
      .subtitle { color: #64748b; margin: 0; font-size: 0.9rem; }
    }
    .loading-state, .empty-state {
      background: white; border-radius: 12px; padding: 2rem; box-shadow: 0 1px 3px rgba(0,0,0,0.08);
      display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.5rem;
      color: #64748b; font-size: 0.95rem;
      i { font-size: 2rem; color: #cbd5e1; }
      p { margin: 0; }
      .hint { font-size: 0.82rem; color: #94a3b8; }
    }
    .requests-list { display: flex; flex-direction: column; gap: 1rem; }
    .request-card {
      background: white; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); overflow: hidden;
    }
    .card-top {
      display: flex; align-items: flex-start; justify-content: space-between;
      padding: 1rem 1.25rem; border-bottom: 1px solid #f1f5f9;
    }
    .card-patient {
      display: flex; flex-direction: column;
      .patient-name { font-weight: 600; color: #1e293b; font-size: 0.95rem; }
      .patient-uhid { font-size: 0.78rem; color: #94a3b8; margin-top: 0.15rem; }
    }
    .status-badge {
      font-size: 0.7rem; font-weight: 600; padding: 0.2rem 0.6rem; border-radius: 20px;
      text-transform: uppercase; letter-spacing: 0.03em; white-space: nowrap;
    }
    .status-requested { background: #fef3c7; color: #92400e; }
    .status-under_review { background: #dbeafe; color: #1e40af; }
    .status-allocated { background: #d1fae5; color: #065f46; }
    .status-rejected { background: #fee2e2; color: #991b1b; }
    .card-details { padding: 1rem 1.25rem; }
    .detail-row {
      display: flex; align-items: flex-start; justify-content: space-between;
      padding: 0.3rem 0; font-size: 0.85rem;
    }
    .detail-label { color: #94a3b8; flex-shrink: 0; margin-right: 1rem; }
    .detail-value { color: #475569; font-weight: 500; text-align: right; }
    .detail-value.clickable { color: #4f46e5; cursor: pointer; &:hover { text-decoration: underline; } }
    .detail-value.allocated { color: #059669; font-weight: 600; }
    .detail-value.rejection { color: #dc2626; }
    .timeline-btn {
      margin-top: 0.35rem; background: #eef2ff; color: #3730a3; border: 1px solid #c7d2fe;
      border-radius: 8px; padding: 0.3rem 0.6rem; cursor: pointer; font-size: 0.75rem; font-weight: 600;
    }
    .timeline-events { margin-top: 0.6rem; border-top: 1px dashed #cbd5e1; padding-top: 0.55rem; }
    .timeline-event { display: flex; flex-direction: column; gap: 0.1rem; margin-bottom: 0.45rem; }
    .evt-type { font-size: 0.76rem; color: #334155; font-weight: 700; text-transform: uppercase; }
    .evt-meta { font-size: 0.73rem; color: #64748b; }
    .evt-notes { font-size: 0.78rem; color: #475569; }
  `]
})
export class BedRequestComponent implements OnInit {
  requests: BedAllocationRequestItem[] = [];
  selectedRequestId: number | null = null;
  selectedTimeline: BedEventItem[] = [];
  loading = false;

  constructor(
    private bedManagementService: BedManagementService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadRequests();
  }

  loadRequests(): void {
    this.loading = true;
    this.bedManagementService.getMyRequests().subscribe({
      next: (data) => {
        this.requests = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  openCase(encounterId: number): void {
    this.router.navigate(['/nurse/case', encounterId]);
  }

  toggleTimeline(requestId: number): void {
    if (this.selectedRequestId === requestId) {
      this.selectedRequestId = null;
      this.selectedTimeline = [];
      return;
    }

    this.selectedRequestId = requestId;
    this.selectedTimeline = [];
    this.bedManagementService.getRequestTimeline(requestId).subscribe({
      next: (events) => {
        this.selectedTimeline = events;
        this.cdr.detectChanges();
      }
    });
  }

  formatEventType(type: string): string {
    return type.replace(/_/g, ' ');
  }

  formatDateTime(dt: string): string {
    if (!dt) return '';
    const d = new Date(dt);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
      ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }
}
