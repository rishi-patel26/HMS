import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { DashboardService } from '@core/services/dashboard.service';
import { DashboardStats } from '@core/models/hms.model';
import { Chart, DoughnutController, BarController, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import { NotificationPanelComponent } from '../../../shared/components/notification-panel.component';

@Component({
  selector: 'app-frontdesk-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, NotificationPanelComponent],
  template: `
    <div class="dashboard-page">
      <div class="page-header">
        <div>
          <h1>Front Desk Dashboard</h1>
          <p class="welcome-text">Welcome back, {{ username }}!</p>
        </div>
        <app-notification-panel></app-notification-panel>
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
            <div class="stat-icon" style="background: #dbeafe;"><i class="pi pi-calendar" style="color: #2563eb;"></i></div>
            <div class="stat-info">
              <span class="stat-value">{{ stats.todayAppointments }}</span>
              <span class="stat-label">Today's Appointments</span>
            </div>
          </div>
 
          <div class="stat-card">
            <div class="stat-icon" style="background: #d1fae5;"><i class="pi pi-comments" style="color: #059669;"></i></div>
            <div class="stat-info">
              <span class="stat-value">{{ stats.checkedInPatients }}</span>
              <span class="stat-label">In Consultation</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background: #fee2e2;"><i class="pi pi-file" style="color: #dc2626;"></i></div>
            <div class="stat-info">
              <span class="stat-value">{{ stats.pendingBills }}</span>
              <span class="stat-label">Pending Bills</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background: #ccfbf1;"><i class="pi pi-dollar" style="color: #0d9488;"></i></div>
            <div class="stat-info">
              <span class="stat-value">{{ stats.todayRevenue | currency:'INR':'symbol':'1.0-0' }}</span>
              <span class="stat-label">Today's Revenue</span>
            </div>
          </div>
        </div>

        <!-- Overall Totals -->
        <h2 class="section-title">Overall Totals</h2>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon" style="background: #ede9fe;"><i class="pi pi-users" style="color: #4f46e5;"></i></div>
            <div class="stat-info">
              <span class="stat-value">{{ stats.totalPatientsAll }}</span>
              <span class="stat-label">Total Patients</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background: #dbeafe;"><i class="pi pi-calendar" style="color: #2563eb;"></i></div>
            <div class="stat-info">
              <span class="stat-value">{{ stats.totalAppointmentsAll }}</span>
              <span class="stat-label">Total Appointments</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background: #e0e7ff;"><i class="pi pi-list" style="color: #4338ca;"></i></div>
            <div class="stat-info">
              <span class="stat-value">{{ stats.totalEncountersAll }}</span>
              <span class="stat-label">Total Encounters</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background: #fce7f3;"><i class="pi pi-bookmark" style="color: #db2777;"></i></div>
            <div class="stat-info">
              <span class="stat-value">{{ stats.totalEpisodesAll }}</span>
              <span class="stat-label">Total Episodes</span>
            </div>
          </div>
        </div>

        <!-- Charts -->
        <div class="charts-grid">
          <!-- <div class="chart-card">
            <h3>Today's Patient Flow</h3>
            <div class="chart-wrap"><canvas id="fdDoughnut"></canvas></div>
          </div> -->
          <div class="chart-card">
            <h3>Appointments & Encounters (Today vs Total)</h3>
            <div class="chart-wrap"><canvas id="fdBar"></canvas></div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="quick-actions">
          <a routerLink="/patients/new" class="action-card">
            <div class="action-icon" style="background: #ede9fe;"><i class="pi pi-user-plus" style="color: #4f46e5;"></i></div>
            <div class="action-text"><h3>Register Patient</h3><p>Register a new patient</p></div>
          </a>
          <a routerLink="/patients" class="action-card">
            <div class="action-icon" style="background: #dbeafe;"><i class="pi pi-search" style="color: #2563eb;"></i></div>
            <div class="action-text"><h3>Search Patient</h3><p>Find existing patients</p></div>
          </a>
          <a routerLink="/appointments/new" class="action-card">
            <div class="action-icon" style="background: #fef3c7;"><i class="pi pi-calendar-plus" style="color: #d97706;"></i></div>
            <div class="action-text"><h3>Book Appointment</h3><p>Schedule an appointment</p></div>
          </a>
          <a routerLink="/encounters/checkin" class="action-card">
            <div class="action-icon" style="background: #d1fae5;"><i class="pi pi-sign-in" style="color: #059669;"></i></div>
            <div class="action-text"><h3>Check In</h3><p>Patient check-in</p></div>
          </a>
          <a routerLink="/encounters" class="action-card">
            <div class="action-icon" style="background: #fce7f3;"><i class="pi pi-list" style="color: #db2777;"></i></div>
            <div class="action-text"><h3>Encounter Queue</h3><p>View waiting patients</p></div>
          </a>
          <a routerLink="/billing/create" class="action-card">
            <div class="action-icon" style="background: #ccfbf1;"><i class="pi pi-money-bill" style="color: #0d9488;"></i></div>
            <div class="action-text"><h3>Create Bill</h3><p>Generate a new bill</p></div>
          </a>
        </div>

        <!-- Patient Flow -->
        <div class="flow-section">
          <h2>Patient Flow</h2>
          <div class="flow-steps">
            <div class="flow-step"><span class="step-num">1</span><span>Search / Register Patient</span></div>
            <div class="flow-arrow"><i class="pi pi-arrow-right"></i></div>
            <div class="flow-step"><span class="step-num">2</span><span>Book Appointment</span></div>
            <div class="flow-arrow"><i class="pi pi-arrow-right"></i></div>
            <div class="flow-step"><span class="step-num">3</span><span>Check In</span></div>
            <div class="flow-arrow"><i class="pi pi-arrow-right"></i></div>
            <div class="flow-step"><span class="step-num">4</span><span>Create Bill & Payment</span></div>
            <div class="flow-arrow"><i class="pi pi-arrow-right"></i></div>
            <div class="flow-step"><span class="step-num">5</span><span>Consultation</span></div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-page { }
    .page-header {
      margin-bottom: 2rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
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
    .stats-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 1rem; margin-bottom: 2rem; }
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
      .stat-label { font-size: 0.75rem; color: #94a3b8; margin-top: 0.15rem; }
    }
    .charts-grid { display: grid; grid-template-columns: repeat(1, 1fr); gap: 1rem; margin-bottom: 2rem; }
    .chart-card {
      background: white; border-radius: 12px; padding: 1.5rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
      h3 { margin: 0 0 1rem 0; font-size: 0.95rem; font-weight: 600; color: #1e293b; }
    }
    .chart-wrap { position: relative; height: 260px; }
    .quick-actions { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 2rem; }
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
        h3 { margin: 0 0 0.15rem 0; font-size: 0.9rem; font-weight: 600; color: #1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        p { margin: 0; font-size: 0.78rem; color: #94a3b8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      }
    }
    .flow-section {
      background: white; border-radius: 12px; padding: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.08);
      h2 { font-size: 1.1rem; font-weight: 600; color: #1e293b; margin: 0 0 1.25rem 0; }
    }
    .flow-steps { display: flex; align-items: center; flex-wrap: wrap; gap: 0.5rem; }
    .flow-step {
      display: flex; align-items: center; gap: 0.5rem; background: #f8fafc;
      padding: 0.6rem 1rem; border-radius: 8px; font-size: 0.85rem; color: #334155; font-weight: 500;
      .step-num {
        width: 24px; height: 24px; border-radius: 50%; background: #4f46e5; color: white;
        display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 700; flex-shrink: 0;
      }
    }
    .flow-arrow { color: #c4b5fd; font-size: 0.85rem; }
    @media (max-width: 1024px) {
      .stats-grid { grid-template-columns: repeat(3, 1fr); }
      .charts-grid, .quick-actions { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 768px) {
      .stats-grid { grid-template-columns: repeat(2, 1fr); }
      .flow-steps { flex-direction: column; align-items: flex-start; }
      .flow-arrow { transform: rotate(90deg); align-self: center; }
    }
    @media (max-width: 480px) {
      .stats-grid, .quick-actions, .charts-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class FrontdeskDashboardComponent implements OnInit {
  username = '';
  stats: DashboardStats | null = null;
  loading = false;
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private dashboardService: DashboardService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.username = this.authService.getUsername();
    this.loadStats();
  }

  loadStats(): void {
    this.loading = true;
    this.errorMessage = '';
    this.dashboardService.getFrontdeskStats().subscribe({
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

    // Today's patient flow doughnut
    const doughnutEl = document.getElementById('fdDoughnut') as HTMLCanvasElement;
    if (doughnutEl) {
      new Chart(doughnutEl, {
        type: 'doughnut',
        data: {
          labels: ['Waiting', 'In Consultation', 'Pending Bills'],
          datasets: [{
            data: [this.stats.waitingPatients, this.stats.checkedInPatients, this.stats.pendingBills],
            backgroundColor: ['#d97706', '#059669', '#dc2626'],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom', labels: { font: { size: 11 }, padding: 12 } } }
        }
      });
    }

    // Today vs Total comparison bar
    const barEl = document.getElementById('fdBar') as HTMLCanvasElement;
    if (barEl) {
      new Chart(barEl, {
        type: 'bar',
        data: {
          labels: ['Appointments', 'Encounters', 'Episodes'],
          datasets: [
            {
              label: 'Today',
              data: [this.stats.todayAppointments, this.stats.totalEncountersAll > 0 ? this.stats.checkedInPatients + this.stats.waitingPatients : 0, 0],
              backgroundColor: '#4f46e5',
              borderRadius: 6
            },
            {
              label: 'Total',
              data: [this.stats.totalAppointmentsAll, this.stats.totalEncountersAll, this.stats.totalEpisodesAll],
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
