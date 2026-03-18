import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NurseService } from '@core/services/nurse.service';
import { DoctorOption, DoctorPatientItem } from '@core/models/hms.model';

@Component({
  selector: 'app-doctor-patients',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h1>Doctor's Patients</h1>
        <p class="subtitle">Select a doctor and search encounters by patient details</p>
      </div>

      <!-- Doctor Selection -->
      <div class="filter-card">
        <div class="filter-row">
          <div class="filter-group">
            <label class="filter-label">Select Doctor</label>
            <select [(ngModel)]="selectedDoctorId" (ngModelChange)="onDoctorChange()" class="filter-input">
              <option [ngValue]="null">-- Choose a doctor --</option>
              <option *ngFor="let doc of doctors" [ngValue]="doc.id">
                Dr. {{ doc.username }}
              </option>
            </select>
          </div>
          <div class="filter-group filter-group-grow">
            <label class="filter-label">Search Patient</label>
            <div class="search-wrapper">
              <i class="pi pi-search search-icon"></i>
              <input type="text"
                [(ngModel)]="searchQuery"
                (ngModelChange)="applyFilters()"
                placeholder="Search by name, UHID or phone..."
                class="filter-input search-input"
                [disabled]="!selectedDoctorId">
            </div>
          </div>
        </div>
        <div class="filter-row">
          <div class="filter-group">
            <label class="filter-label">From Date</label>
            <input type="date"
              [(ngModel)]="dateFrom"
              (ngModelChange)="applyFilters()"
              class="filter-input"
              [disabled]="!selectedDoctorId">
          </div>
          <div class="filter-group">
            <label class="filter-label">To Date</label>
            <input type="date"
              [(ngModel)]="dateTo"
              (ngModelChange)="applyFilters()"
              class="filter-input"
              [disabled]="!selectedDoctorId">
          </div>
          <div class="filter-group filter-actions">
            <button class="clear-btn" (click)="clearFilters()" *ngIf="hasActiveFilters()">
              <i class="pi pi-filter-slash"></i> Clear Filters
            </button>
          </div>
        </div>
      </div>

      <!-- Results summary -->
      <div class="results-summary" *ngIf="selectedDoctorId && !loadingPatients && allPatients.length > 0">
        Showing {{ filteredPatients.length }} of {{ allPatients.length }} encounters
      </div>

      <!-- Loading -->
      <div class="loading-state" *ngIf="loadingPatients">
        <i class="pi pi-spin pi-spinner"></i>
        <span>Loading encounters...</span>
      </div>

      <!-- Empty state: no data at all -->
      <div class="empty-state" *ngIf="!loadingPatients && selectedDoctorId && allPatients.length === 0">
        <i class="pi pi-inbox"></i>
        <p>No encounters found for this doctor</p>
      </div>

      <!-- Empty state: filters returned nothing -->
      <div class="empty-state" *ngIf="!loadingPatients && selectedDoctorId && allPatients.length > 0 && filteredPatients.length === 0">
        <i class="pi pi-search"></i>
        <p>No encounters match your search criteria</p>
      </div>

      <!-- Patients list as cards -->
      <div class="patients-grid" *ngIf="filteredPatients.length > 0">
        <div class="patient-card" *ngFor="let p of filteredPatients" (click)="openCase(p.encounterId)">
          <div class="card-header">
            <div class="patient-main">
              <span class="patient-name">{{ p.patientName }}</span>
              <span class="patient-uhid">{{ p.patientUhid }}</span>
            </div>
            <span class="status-badge" [class]="'badge-' + p.encounterStatus.toLowerCase()">
              {{ formatStatus(p.encounterStatus) }}
            </span>
          </div>
          <div class="card-body">
            <div class="detail-row">
              <span class="detail-label">Encounter</span>
              <span class="detail-value">{{ p.encounterNumber }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Visit Date</span>
              <span class="detail-value">{{ formatDate(p.visitDate) }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Visit Type</span>
              <span class="visit-badge" [class]="'visit-' + p.visitType.toLowerCase()">{{ p.visitType }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Priority</span>
              <span class="priority-badge" [class]="'priority-' + p.priority.toLowerCase()">{{ p.priority }}</span>
            </div>
            <div class="detail-row" *ngIf="p.phone">
              <span class="detail-label">Phone</span>
              <span class="detail-value">{{ p.phone }}</span>
            </div>
            <div class="detail-row" *ngIf="p.gender">
              <span class="detail-label">Gender</span>
              <span class="detail-value">{{ p.gender }}</span>
            </div>
            <div class="detail-row" *ngIf="p.roomNumber">
              <span class="detail-label">Room</span>
              <span class="detail-value">{{ p.roomNumber }}</span>
            </div>
            <div class="detail-row" *ngIf="p.checkinTime">
              <span class="detail-label">Check-in</span>
              <span class="detail-value">{{ formatTime(p.checkinTime) }}</span>
            </div>
          </div>
          <div class="card-footer">
            <button class="open-case-btn" (click)="openCase(p.encounterId); $event.stopPropagation()">
              <i class="pi pi-folder-open"></i> Open Case
            </button>
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
    .filter-card {
      background: white; border-radius: 12px; padding: 1.25rem; margin-bottom: 1.5rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    }
    .filter-row {
      display: flex; gap: 1rem; align-items: flex-end; flex-wrap: wrap;
      &:not(:last-child) { margin-bottom: 1rem; }
    }
    .filter-group {
      display: flex; flex-direction: column; gap: 0.35rem; min-width: 180px;
    }
    .filter-group-grow { flex: 1; min-width: 250px; }
    .filter-label { font-size: 0.78rem; font-weight: 600; color: #64748b; }
    .filter-input {
      width: 100%; padding: 0.55rem 0.75rem; border: 1.5px solid #e2e8f0; border-radius: 8px;
      font-size: 0.88rem; color: #1e293b; background: white; outline: none;
      &:focus { border-color: #4f46e5; box-shadow: 0 0 0 3px rgba(79,70,229,0.1); }
      &:disabled { background: #f8fafc; color: #94a3b8; cursor: not-allowed; }
    }
    .search-wrapper { position: relative; }
    .search-icon {
      position: absolute; left: 0.75rem; top: 50%; transform: translateY(-50%);
      color: #94a3b8; font-size: 0.9rem; pointer-events: none;
    }
    .search-input { padding-left: 2.25rem; }
    .filter-actions { justify-content: flex-end; }
    .clear-btn {
      background: #f1f5f9; color: #475569; border: 1.5px solid #e2e8f0; border-radius: 8px;
      padding: 0.55rem 1rem; font-size: 0.82rem; cursor: pointer; font-weight: 600;
      display: flex; align-items: center; gap: 0.4rem; white-space: nowrap;
      transition: all 0.2s;
      &:hover { background: #e2e8f0; border-color: #cbd5e1; }
    }
    .results-summary {
      font-size: 0.82rem; color: #64748b; margin-bottom: 1rem; padding-left: 0.25rem;
    }
    .loading-state, .empty-state {
      background: white; border-radius: 12px; padding: 2rem; box-shadow: 0 1px 3px rgba(0,0,0,0.08);
      display: flex; align-items: center; justify-content: center; gap: 0.75rem;
      color: #64748b; font-size: 0.95rem; flex-direction: column;
      i { font-size: 2rem; color: #cbd5e1; }
      p { margin: 0.5rem 0 0 0; }
    }
    .patients-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 1rem;
    }
    .patient-card {
      background: white; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.08);
      transition: all 0.2s; cursor: pointer; overflow: hidden;
      &:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.12); }
    }
    .card-header {
      display: flex; align-items: flex-start; justify-content: space-between;
      padding: 1rem 1.25rem; border-bottom: 1px solid #f1f5f9;
    }
    .patient-main {
      display: flex; flex-direction: column;
      .patient-name { font-weight: 600; color: #1e293b; font-size: 0.95rem; }
      .patient-uhid { font-size: 0.78rem; color: #94a3b8; margin-top: 0.15rem; }
    }
    .status-badge {
      font-size: 0.7rem; font-weight: 600; padding: 0.2rem 0.6rem; border-radius: 20px;
      text-transform: uppercase; letter-spacing: 0.03em; white-space: nowrap;
    }
    .badge-waiting { background: #fef3c7; color: #92400e; }
    .badge-in_consultation { background: #dbeafe; color: #1e40af; }
    .badge-completed { background: #d1fae5; color: #065f46; }
    .badge-cancelled { background: #fee2e2; color: #991b1b; }
    .card-body { padding: 1rem 1.25rem; }
    .detail-row {
      display: flex; align-items: center; justify-content: space-between;
      padding: 0.3rem 0; font-size: 0.82rem;
    }
    .detail-label { color: #94a3b8; }
    .detail-value { color: #475569; font-weight: 500; }
    .visit-badge {
      font-size: 0.7rem; font-weight: 600; padding: 0.15rem 0.5rem; border-radius: 6px;
    }
    .visit-opd { background: #e0e7ff; color: #3730a3; }
    .visit-ipd { background: #fce7f3; color: #9d174d; }
    .priority-badge {
      font-size: 0.7rem; font-weight: 600; padding: 0.15rem 0.5rem; border-radius: 6px;
    }
    .priority-normal { background: #d1fae5; color: #065f46; }
    .priority-urgent { background: #fef3c7; color: #92400e; }
    .priority-emergency { background: #fee2e2; color: #991b1b; }
    .card-footer {
      padding: 0.75rem 1.25rem; border-top: 1px solid #f1f5f9;
    }
    .open-case-btn {
      background: #4f46e5; color: white; border: none; border-radius: 8px;
      padding: 0.5rem 1rem; font-size: 0.82rem; cursor: pointer; font-weight: 600;
      display: flex; align-items: center; gap: 0.4rem; width: 100%; justify-content: center;
      transition: background 0.2s;
      &:hover { background: #4338ca; }
    }
    @media (max-width: 768px) {
      .filter-row { flex-direction: column; }
      .filter-group { min-width: 100%; }
    }
    @media (max-width: 480px) {
      .patients-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class DoctorPatientsComponent implements OnInit {
  doctors: DoctorOption[] = [];
  selectedDoctorId: number | null = null;
  allPatients: DoctorPatientItem[] = [];
  filteredPatients: DoctorPatientItem[] = [];
  loadingPatients = false;

  searchQuery = '';
  dateFrom = '';
  dateTo = '';

  constructor(
    private nurseService: NurseService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.nurseService.getDoctors().subscribe({
      next: (docs) => {
        this.doctors = docs;
        this.cdr.detectChanges();
      }
    });
  }

  onDoctorChange(): void {
    this.searchQuery = '';
    this.dateFrom = '';
    this.dateTo = '';

    if (!this.selectedDoctorId) {
      this.allPatients = [];
      this.filteredPatients = [];
      return;
    }
    this.loadingPatients = true;
    this.nurseService.getDoctorPatients(this.selectedDoctorId).subscribe({
      next: (patients) => {
        this.allPatients = patients;
        this.applyFilters();
        this.loadingPatients = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingPatients = false;
        this.cdr.detectChanges();
      }
    });
  }

  applyFilters(): void {
    let result = [...this.allPatients];
    const query = this.searchQuery.trim().toLowerCase();

    if (query) {
      result = result.filter(p =>
        p.patientName.toLowerCase().includes(query) ||
        p.patientUhid.toLowerCase().includes(query) ||
        (p.phone && p.phone.toLowerCase().includes(query))
      );
    }

    if (this.dateFrom) {
      result = result.filter(p => {
        const visitDay = p.visitDate ? p.visitDate.substring(0, 10) : '';
        return visitDay >= this.dateFrom;
      });
    }

    if (this.dateTo) {
      result = result.filter(p => {
        const visitDay = p.visitDate ? p.visitDate.substring(0, 10) : '';
        return visitDay <= this.dateTo;
      });
    }

    this.filteredPatients = result;
    this.cdr.detectChanges();
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.dateFrom = '';
    this.dateTo = '';
    this.applyFilters();
  }

  hasActiveFilters(): boolean {
    return !!(this.searchQuery.trim() || this.dateFrom || this.dateTo);
  }

  openCase(encounterId: number): void {
    this.router.navigate(['/nurse/case', encounterId]);
  }

  formatStatus(status: string): string {
    return status.replace(/_/g, ' ');
  }

  formatDate(dateTime: string): string {
    if (!dateTime) return '';
    const d = new Date(dateTime);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  formatTime(dateTime: string): string {
    if (!dateTime) return '';
    const d = new Date(dateTime);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }
}
