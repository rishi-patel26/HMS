import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { NurseService } from '@core/services/nurse.service';
import { NurseDashboardStats } from '@core/models/hms.model';
import { Chart, DoughnutController, BarController, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';

@Component({
  selector: 'app-nurse-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="dashboard-page">
      <div class="page-header">
        <div>
          <h1>Nurse Dashboard</h1>
          <p class="welcome-text">Welcome back, {{ username }}!</p>
        </div>
      </div>

      <div class="loading-state" *ngIf="loading">
        <i class="pi pi-spin pi-spinner"></i>
        <span>Loading dashboard...</span>
      </div>

      <div class="error-state" *ngIf="errorMessage">
        <i class="pi pi-exclamation-triangle"></i>
        <span>{{ errorMessage }}</span>
        <button class="retry-btn" (click)="loadStats()">Retry</button>
      </div>

      <div *ngIf="stats">
        <!-- Today's Live Status -->
        <h2 class="section-title">Today's Status</h2>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon" style="background: #dbeafe;"><i class="pi pi-user-edit" style="color: #2563eb;"></i></div>
            <div class="stat-info">
              <span class="stat-value">{{ stats.totalActiveDoctors }}</span>
              <span class="stat-label">Active Doctors</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background: #fef3c7;"><i class="pi pi-list" style="color: #d97706;"></i></div>
            <div class="stat-info">
              <span class="stat-value">{{ stats.todayEncounters }}</span>
              <span class="stat-label">Today's Encounters</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background: #fce7f3;"><i class="pi pi-clock" style="color: #db2777;"></i></div>
            <div class="stat-info">
              <span class="stat-value">{{ stats.waitingPatients }}</span>
              <span class="stat-label">Waiting Patients</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background: #d1fae5;"><i class="pi pi-comments" style="color: #059669;"></i></div>
            <div class="stat-info">
              <span class="stat-value">{{ stats.inConsultationPatients }}</span>
              <span class="stat-label">In Consultation</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background: #ccfbf1;"><i class="pi pi-check-circle" style="color: #0d9488;"></i></div>
            <div class="stat-info">
              <span class="stat-value">{{ stats.completedToday }}</span>
              <span class="stat-label">Completed Today</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background: #e0e7ff;"><i class="pi pi-file-edit" style="color: #4338ca;"></i></div>
            <div class="stat-info">
              <span class="stat-value">{{ stats.todayConsultations }}</span>
              <span class="stat-label">Today's Consultations</span>
            </div>
          </div>
        </div>

        <!-- Overall Totals -->
        <h2 class="section-title">Overall Totals</h2>
        <div class="totals-grid">
          <div class="stat-card">
            <div class="stat-icon" style="background: #ede9fe;"><i class="pi pi-users" style="color: #4f46e5;"></i></div>
            <div class="stat-info">
              <span class="stat-value">{{ stats.totalPatients }}</span>
              <span class="stat-label">Total Patients</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background: #dbeafe;"><i class="pi pi-list" style="color: #2563eb;"></i></div>
            <div class="stat-info">
              <span class="stat-value">{{ stats.totalEncounters }}</span>
              <span class="stat-label">Total Encounters</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background: #d1fae5;"><i class="pi pi-file-edit" style="color: #059669;"></i></div>
            <div class="stat-info">
              <span class="stat-value">{{ stats.totalConsultations }}</span>
              <span class="stat-label">Total Consultations</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background: #fef3c7;"><i class="pi pi-user-edit" style="color: #d97706;"></i></div>
            <div class="stat-info">
              <span class="stat-value">{{ stats.totalDoctors }}</span>
              <span class="stat-label">Total Doctors</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background: #e0e7ff;"><i class="pi pi-building" style="color: #4338ca;"></i></div>
            <div class="stat-info">
              <span class="stat-value">{{ stats.myPendingBedRequests }} / {{ stats.myTotalBedRequests }}</span>
              <span class="stat-label">My Bed Requests (Pending / Total)</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background: #fee2e2;"><i class="pi pi-building" style="color: #dc2626;"></i></div>
            <div class="stat-info">
              <span class="stat-value">{{ stats.totalPendingBedRequests }} / {{ stats.totalBedRequests }}</span>
              <span class="stat-label">All Bed Requests (Pending / Total)</span>
            </div>
          </div>
        </div>

        <!-- Charts -->
        <div class="charts-grid">
          <div class="chart-card">
            <h3>Today's Patient Status</h3>
            <div class="chart-wrap"><canvas id="nurseDoughnut"></canvas></div>
          </div>
          <div class="chart-card">
            <h3>Encounters & Consultations (Today vs Total)</h3>
            <div class="chart-wrap"><canvas id="nurseBar"></canvas></div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="quick-actions">
          <a routerLink="/nurse/doctor-patients" class="action-card">
            <div class="action-icon" style="background: #dbeafe;"><i class="pi pi-users" style="color: #2563eb;"></i></div>
            <div class="action-text"><h3>Doctor's Patients</h3><p>Select a doctor and view encounters</p></div>
          </a>
          <a routerLink="/nurse/bed-management" class="action-card">
            <div class="action-icon" style="background: #e0e7ff;"><i class="pi pi-building" style="color: #4338ca;"></i></div>
            <div class="action-text"><h3>Bed Management</h3><p>Track request workflow and timeline</p></div>
          </a>
          <a routerLink="/encounters" class="action-card">
            <div class="action-icon" style="background: #fef3c7;"><i class="pi pi-list" style="color: #d97706;"></i></div>
            <div class="action-text"><h3>Encounter Queue</h3><p>View today's encounter queue</p></div>
          </a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-page { }
    .page-header {
      margin-bottom: 2rem;
      h1 { font-size: 1.5rem; font-weight: 700; color: #1e293b; margin: 0 0 0.25rem 0; }
      .welcome-text { color: #64748b; margin: 0; font-size: 0.95rem; }
    }
    .loading-state, .error-state {
      background: white; border-radius: 12px; padding: 2rem; margin-bottom: 2rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08); display: flex; align-items: center;
      justify-content: center; gap: 0.75rem; color: #64748b; font-size: 0.95rem;
      i { font-size: 1.5rem; }
    }
    .error-state { color: #dc2626; i { color: #dc2626; } }
    .retry-btn {
      background: #4f46e5; color: white; border: none; border-radius: 8px;
      padding: 0.4rem 1rem; font-size: 0.85rem; cursor: pointer; font-weight: 600;
      &:hover { background: #4338ca; }
    }
    .section-title { font-size: 1.1rem; font-weight: 600; color: #1e293b; margin: 0 0 1rem 0; }
    .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 2rem; }
    .totals-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 2rem; }
    .stat-card {
      background: white; border-radius: 12px; padding: 1.25rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08); display: flex; align-items: center; gap: 1rem;
    }
    .stat-icon {
      width: 48px; height: 48px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      i { font-size: 1.25rem; }
    }
    .stat-info {
      display: flex; flex-direction: column;
      .stat-value { font-size: 1.5rem; font-weight: 700; color: #1e293b; }
      .stat-label { font-size: 0.8rem; color: #94a3b8; margin-top: 0.15rem; }
    }
    .charts-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; margin-bottom: 2rem; }
    .chart-card {
      background: white; border-radius: 12px; padding: 1.5rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
      h3 { margin: 0 0 1rem 0; font-size: 0.95rem; font-weight: 600; color: #1e293b; }
    }
    .chart-wrap { position: relative; height: 260px; }
    .quick-actions { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
    .action-card {
      background: white; border-radius: 12px; padding: 1.25rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08); text-decoration: none;
      transition: all 0.2s; cursor: pointer; display: flex; align-items: center; gap: 1rem;
      &:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.12); }
      .action-icon {
        width: 44px; height: 44px; border-radius: 10px;
        display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        i { font-size: 1.15rem; }
      }
      .action-text {
        flex: 1; min-width: 0;
        h3 { margin: 0 0 0.15rem 0; font-size: 0.9rem; font-weight: 600; color: #1e293b; }
        p { margin: 0; font-size: 0.78rem; color: #94a3b8; }
      }
    }
    @media (max-width: 1024px) {
      .stats-grid, .totals-grid { grid-template-columns: repeat(2, 1fr); }
      .charts-grid, .quick-actions { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 480px) {
      .stats-grid, .totals-grid, .charts-grid, .quick-actions { grid-template-columns: 1fr; }
    }
  `]
})
export class NurseDashboardComponent implements OnInit {
  username = '';
  stats: NurseDashboardStats | null = null;
  loading = false;
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private nurseService: NurseService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.username = this.authService.getUsername();
    this.loadStats();
  }

  loadStats(): void {
    this.loading = true;
    this.errorMessage = '';
    this.nurseService.getDashboardStats().subscribe({
      next: (stats) => {
        this.stats = stats;
        this.loading = false;
        this.cdr.detectChanges();
        setTimeout(() => this.renderCharts(), 100);
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'Failed to load dashboard statistics.';
        this.cdr.detectChanges();
      }
    });
  }

  private renderCharts(): void {
    if (!this.stats) return;
    Chart.register(DoughnutController, BarController, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

    const doughnutEl = document.getElementById('nurseDoughnut') as HTMLCanvasElement;
    if (doughnutEl) {
      new Chart(doughnutEl, {
        type: 'doughnut',
        data: {
          labels: ['Waiting', 'In Consultation', 'Completed'],
          datasets: [{
            data: [this.stats.waitingPatients, this.stats.inConsultationPatients, this.stats.completedToday],
            backgroundColor: ['#d97706', '#2563eb', '#059669'],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom', labels: { font: { size: 11 }, padding: 12 } } }
        }
      });
    }

    const barEl = document.getElementById('nurseBar') as HTMLCanvasElement;
    if (barEl) {
      new Chart(barEl, {
        type: 'bar',
        data: {
          labels: ['Encounters', 'Consultations', 'Bed Requests'],
          datasets: [
            {
              label: 'Today',
              data: [this.stats.todayEncounters, this.stats.todayConsultations, this.stats.myPendingBedRequests],
              backgroundColor: '#4f46e5',
              borderRadius: 6
            },
            {
              label: 'Total',
              data: [this.stats.totalEncounters, this.stats.totalConsultations, this.stats.totalBedRequests],
              backgroundColor: '#c7d2fe',
              borderRadius: 6
            }
          ]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { position: 'top', labels: { font: { size: 11 } } } },
          scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
        }
      });
    }
  }
}
