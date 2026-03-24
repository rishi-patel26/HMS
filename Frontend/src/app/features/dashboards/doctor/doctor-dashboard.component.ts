import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '@core/services/auth.service';
import { DashboardService } from '@core/services/dashboard.service';
import { AppointmentService } from '@core/services/appointment.service';
import { DashboardStats, Appointment } from '@core/models/hms.model';
import { Chart, DoughnutController, BarController, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import { NotificationPanelComponent } from '../../../shared/components/notification-panel.component';
import { CalendarOptions } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { FullCalendarModule } from '@fullcalendar/angular';

@Component({
  selector: 'app-doctor-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, NotificationPanelComponent, FullCalendarModule],
  template: `
    <div class="dashboard-page">
      <div class="page-header">
        <div>
          <h1>Doctor Dashboard</h1>
          <p class="welcome-text">Welcome back, Dr. {{ username }}!</p>
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
        <!-- Today's Status -->
        <h2 class="section-title">Today's Status</h2>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon" style="background: #fef3c7;"><i class="pi pi-clock" style="color: #d97706;"></i></div>
            <div class="stat-info">
              <span class="stat-value">{{ stats.patientsWaiting }}</span>
              <span class="stat-label">Waiting Patients</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background: #dbeafe;"><i class="pi pi-list" style="color: #2563eb;"></i></div>
            <div class="stat-info">
              <span class="stat-value">{{ stats.encounterQueue }}</span>
              <span class="stat-label">Encounter Queue</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background: #d1fae5;"><i class="pi pi-check-circle" style="color: #059669;"></i></div>
            <div class="stat-info">
              <span class="stat-value">{{ stats.doctorTodayConsultations }}</span>
              <span class="stat-label">Today's Consultations</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background: #fce7f3;"><i class="pi pi-calendar-plus" style="color: #db2777;"></i></div>
            <div class="stat-info">
              <span class="stat-value">{{ stats.doctorTodayAppointments }}</span>
              <span class="stat-label">Today's Appointments</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background: #e0e7ff;"><i class="pi pi-users" style="color: #4338ca;"></i></div>
            <div class="stat-info">
              <span class="stat-value">{{ stats.doctorTodayPatients }}</span>
              <span class="stat-label">Today's Patients</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background: #ccfbf1;"><i class="pi pi-verified" style="color: #0d9488;"></i></div>
            <div class="stat-info">
              <span class="stat-value">{{ stats.doctorCompletedToday }}</span>
              <span class="stat-label">Completed Today</span>
            </div>
          </div>
        </div>

        <!-- Overall Totals -->
        <h2 class="section-title">My Overall Totals</h2>
        <div class="totals-grid">
          <div class="stat-card">
            <div class="stat-icon" style="background: #ede9fe;"><i class="pi pi-calendar" style="color: #4f46e5;"></i></div>
            <div class="stat-info">
              <span class="stat-value">{{ stats.doctorTotalAppointments }}</span>
              <span class="stat-label">Total Appointments</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background: #dbeafe;"><i class="pi pi-list" style="color: #2563eb;"></i></div>
            <div class="stat-info">
              <span class="stat-value">{{ stats.doctorTotalEncounters }}</span>
              <span class="stat-label">Total Encounters</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background: #d1fae5;"><i class="pi pi-file-edit" style="color: #059669;"></i></div>
            <div class="stat-info">
              <span class="stat-value">{{ stats.doctorTotalConsultations }}</span>
              <span class="stat-label">Total Consultations</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background: #fef3c7;"><i class="pi pi-bookmark" style="color: #d97706;"></i></div>
            <div class="stat-info">
              <span class="stat-value">{{ stats.doctorActiveEpisodes }}</span>
              <span class="stat-label">Active Episodes</span>
            </div>
          </div>
        </div>

        <!-- Charts -->
        <div class="charts-grid">
          <div class="chart-card">
            <h3>Today's Queue Breakdown</h3>
            <div class="chart-wrap"><canvas id="docDoughnut"></canvas></div>
          </div>
          <div class="chart-card">
            <h3>My Activity (Today vs Total)</h3>
            <div class="chart-wrap"><canvas id="docBar"></canvas></div>
          </div>
        </div>

        <!-- Appointment Calendar -->
        <h2 class="section-title">My Appointment Calendar</h2>
        <div class="calendar-section">
          <full-calendar [options]="calendarOptions"></full-calendar>
        </div>

        <!-- Quick Actions -->
        <div class="quick-actions">
          <a routerLink="/consultation" class="action-card">
            <div class="action-icon" style="background: #d1fae5;"><i class="pi pi-file-edit" style="color: #059669;"></i></div>
            <div class="action-text"><h3>Start Consultation</h3><p>Begin a new consultation</p></div>
          </a>
          <a routerLink="/appointments" class="action-card">
            <div class="action-icon" style="background: #fce7f3;"><i class="pi pi-calendar" style="color: #db2777;"></i></div>
            <div class="action-text"><h3>Appointments</h3><p>View my appointments</p></div>
          </a>
          <a routerLink="/episodes" class="action-card">
            <div class="action-icon" style="background: #fef3c7;"><i class="pi pi-bookmark" style="color: #d97706;"></i></div>
            <div class="action-text"><h3>Episodes</h3><p>Manage patient episodes</p></div>
          </a>
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
    .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 2rem; }
    .totals-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 2rem; }
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

    /* Date Filter */
    .date-filter-section {
      margin-bottom: 1rem;
      display: flex;
      align-items: center;
      justify-content: flex-start;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .date-filter {
      display: flex;
      align-items: flex-end;
      gap: 1rem;
    }
    .date-field {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      label {
        font-size: 0.78rem;
        font-weight: 600;
        color: #64748b;
      }
    }
    .date-input {
      padding: 0.5rem 0.75rem;
      border: 1.5px solid #e2e8f0;
      border-radius: 8px;
      font-size: 0.85rem;
      color: #1e293b;
      background: white;
      outline: none;
      &:focus {
        border-color: #4f46e5;
        box-shadow: 0 0 0 3px rgba(79,70,229,0.1);
      }
    }

    /* Calendar Section */
    .calendar-section {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
      margin-bottom: 2rem;
      color: #0a111d;
      font-size: 1rem;

      ::ng-deep {
        .fc {
          font-family: inherit;
        }
        .fc-toolbar-title {
          font-size: 1rem;
          font-weight: 600;
          color: #1e293b;
        }
        .fc-button {
          background: #667eea;
          border-color: #667eea;
          text-transform: capitalize;
          font-size: 0.85rem;
          padding: 0.4rem 0.8rem;
          &:hover {
            background: #5568d3;
            border-color: #5568d3;
          }
          &:disabled {
            opacity: 0.5;
          }
        }
        .fc-button-active {
          background: #4f46e5 !important;
          border-color: #4f46e5 !important;
        }
        .fc-daygrid-day-number {
          
          font-weight: 500;
          text-align: center;
        }
        .fc-col-header-cell-cushion {
          color: #242d39;
          font-weight: 400;
          font-size: 0.85rem;
        }
        .fc-event {
          border-radius: 4px;
          padding: 2px 4px;
          font-size: 0.75rem;
          cursor: pointer;
          border: none;
        }
        .fc-daygrid-day-top {
          justify-content: center;
        }
        .fc-daygrid-day.fc-day-today {
        }
        .fc-timegrid-slot {
          height: 3rem;
        }
        .fc-timegrid-event {
          border-radius: 4px;
          border: none;
          padding: 10px;
        }
      }
    }

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
export class DoctorDashboardComponent implements OnInit, OnDestroy {
  username = '';
  stats: DashboardStats | null = null;
  loading = false;
  errorMessage = '';

  // Appointment calendar data
  doctorAppointments: Appointment[] = [];

  // FullCalendar configuration
  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    initialView: 'timeGridWeek',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay'
    },
    events: [],
    eventClick: this.handleEventClick.bind(this),
    height: 'auto',
    slotMinTime: '08:00:00',
    slotMaxTime: '20:00:00',
    allDaySlot: false,
    nowIndicator: true,
    eventColor: '#4261e9'
  };

  private charts: Chart[] = [];

  constructor(
    private authService: AuthService,
    private dashboardService: DashboardService,
    private appointmentService: AppointmentService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.username = this.authService.getUsername();
    this.loadStats();
    this.loadAppointmentCalendar();
  }

  ngOnDestroy(): void {
    this.destroyCharts();
  }

  loadStats(): void {
    this.loading = true;
    this.errorMessage = '';
    this.dashboardService.getDoctorStats().subscribe({
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

  loadAppointmentCalendar(): void {
    this.appointmentService.getDoctorAllAppointments().subscribe({
      next: (appointments: Appointment[]) => {
        this.doctorAppointments = appointments;
        this.calendarOptions = {
          ...this.calendarOptions,
          events: appointments.map((apt: Appointment) => ({
            id: apt.id.toString(),
            title: `${apt.patientName}`,
            start: apt.appointmentTime,
            backgroundColor: this.getStatusColor(apt.status),
            borderColor: this.getStatusColor(apt.status),
            extendedProps: {
              patientName: apt.patientName,
              patientUhid: apt.patientUhid,
              department: apt.department,
              status: apt.status,
              appointmentId: apt.id
            }
          }))
        };
        this.cdr.detectChanges();
      },
      error: () => console.error('Failed to load doctor appointments')
    });
  }

  handleEventClick(info: any): void {
    const event = info.event;
    const startTime = new Date(event.start).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
    const details = `Appointment Details:\n\nPatient: ${event.extendedProps.patientName}\nUHID: ${event.extendedProps.patientUhid}\nDepartment: ${event.extendedProps.department}\nStatus: ${event.extendedProps.status}\nTime: ${startTime}`;
    alert(details);
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'SCHEDULED': '#667eea',
      'CONFIRMED': '#66BB6A',
      'COMPLETED': '#42A5F5',
      'CANCELLED': '#EF5350',
      'NO_SHOW': '#FFA726'
    };
    return colors[status] || '#667eea';
  }

  private formatDate(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private renderCharts(): void {
    if (!this.stats) return;
    Chart.register(DoughnutController, BarController, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

    // Today's queue breakdown doughnut
    const doughnutEl = document.getElementById('docDoughnut') as HTMLCanvasElement;
    if (doughnutEl) {
      const chart = new Chart(doughnutEl, {
        type: 'doughnut',
        data: {
          labels: ['Waiting', 'In Queue', 'Completed Today'],
          datasets: [{
            data: [this.stats.patientsWaiting, this.stats.encounterQueue, this.stats.doctorCompletedToday],
            backgroundColor: ['#d97706', '#2563eb', '#059669'],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom', labels: { font: { size: 11 }, padding: 12 } } }
        }
      });
      this.charts.push(chart);
    }

    // Today vs Total bar chart
    const barEl = document.getElementById('docBar') as HTMLCanvasElement;
    if (barEl) {
      const chart = new Chart(barEl, {
        type: 'bar',
        data: {
          labels: ['Appointments', 'Encounters', 'Consultations'],
          datasets: [
            {
              label: 'Today',
              data: [this.stats.doctorTodayAppointments, this.stats.doctorTodayPatients, this.stats.doctorTodayConsultations],
              backgroundColor: '#4f46e5',
              borderRadius: 6
            },
            {
              label: 'Total',
              data: [this.stats.doctorTotalAppointments, this.stats.doctorTotalEncounters, this.stats.doctorTotalConsultations],
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
      this.charts.push(chart);
    }
  }

  private destroyCharts(): void {
    this.charts.forEach(c => c.destroy());
    this.charts = [];
  }
}
