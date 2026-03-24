import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '@core/services/auth.service';
import { DashboardService } from '@core/services/dashboard.service';
import {
  DashboardStats,
  DailyTrendResponse,
  RevenueTrendResponse,
  EncounterStatusDistribution,
  AppointmentCalendarEvent,
  DepartmentStats
} from '@core/models/hms.model';
import {
  Chart, BarController, LineController, DoughnutController,
  BarElement, LineElement, PointElement, ArcElement,
  CategoryScale, LinearScale, Tooltip, Legend, Filler
} from 'chart.js';
import { CalendarOptions } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { FullCalendarModule } from '@fullcalendar/angular';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, FullCalendarModule],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  username = '';
  stats: DashboardStats | null = null;
  loading = false;
  errorMessage = '';

  // Date range for trend charts
  dateFrom = '';
  dateTo = '';

  // Trend data
  trendData: DailyTrendResponse | null = null;
  revenueData: RevenueTrendResponse | null = null;
  trendLoading = false;
  revenueLoading = false;

  // New chart data
  encounterStatusData: EncounterStatusDistribution | null = null;
  departmentStatsData: DepartmentStats | null = null;
  appointmentEvents: AppointmentCalendarEvent[] = [];

  // FullCalendar configuration
  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay'
    },
    events: [],
    eventClick: this.handleEventClick.bind(this),
    height: 'auto',
    eventColor: '#667eea'
  };

  // Chart instances for cleanup
  private charts: Chart[] = [];

  constructor(
    private authService: AuthService,
    private dashboardService: DashboardService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    Chart.register(
      BarController, LineController, DoughnutController,
      BarElement, LineElement, PointElement, ArcElement,
      CategoryScale, LinearScale, Tooltip, Legend, Filler
    );

    this.username = this.authService.getUsername();

    // Default: last 7 days for trends
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 6);
    this.dateTo = this.formatDate(today);
    this.dateFrom = this.formatDate(weekAgo);

    this.loadStats();
    this.loadTrends();
    this.loadEnhancedCharts();
    this.loadAppointmentCalendar();
  }

  ngOnDestroy(): void {
    this.destroyCharts();
  }

  loadStats(): void {
    this.loading = true;
    this.errorMessage = '';
    this.dashboardService.getAdminStats().subscribe({
      next: (stats) => {
        this.stats = stats;
        this.loading = false;
        this.cdr.detectChanges();
        setTimeout(() => this.renderSummaryCharts(), 100);
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'Failed to load dashboard statistics.';
        this.cdr.detectChanges();
      }
    });
  }

  loadTrends(): void {
    this.trendLoading = true;
    this.revenueLoading = true;
    this.cdr.detectChanges();

    this.dashboardService.getDailyTrends(this.dateFrom, this.dateTo).subscribe({
      next: (data) => {
        this.trendData = data;
        this.trendLoading = false;
        this.cdr.detectChanges();
        setTimeout(() => this.renderTrendChart(), 50);
      },
      error: () => {
        this.trendLoading = false;
        this.cdr.detectChanges();
      }
    });

    this.dashboardService.getRevenueTrends(this.dateFrom, this.dateTo).subscribe({
      next: (data) => {
        this.revenueData = data;
        this.revenueLoading = false;
        this.cdr.detectChanges();
        setTimeout(() => this.renderRevenueChart(), 50);
      },
      error: () => {
        this.revenueLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onDateRangeChange(): void {
    if (this.dateFrom && this.dateTo && this.dateFrom <= this.dateTo) {
      // Destroy only trend charts before re-rendering
      this.destroyChartById('trendLineChart');
      this.destroyChartById('revenueLineChart');
      this.loadTrends();
    }
  }

  loadEnhancedCharts(): void {
    // Load encounter status distribution
    this.dashboardService.getEncounterStatusDistribution().subscribe({
      next: (data) => {
        this.encounterStatusData = data;
        this.cdr.detectChanges();
        setTimeout(() => this.renderEncounterStatusChart(), 50);
      },
      error: () => console.error('Failed to load encounter status data')
    });

    // Load department stats
    this.dashboardService.getDepartmentStats().subscribe({
      next: (data) => {
        this.departmentStatsData = data;
        this.cdr.detectChanges();
        setTimeout(() => this.renderDepartmentChart(), 50);
      },
      error: () => console.error('Failed to load department stats')
    });
  }

  loadAppointmentCalendar(): void {
    this.dashboardService.getAllAppointments().subscribe({
      next: (appointments: any[]) => {
        this.appointmentEvents = appointments;
        this.calendarOptions = {
          ...this.calendarOptions,
          events: appointments.map((apt: any) => ({
            id: apt.id.toString(),
            title: `${apt.patientName} - Dr. ${apt.doctorName}`,
            start: apt.appointmentTime,
            backgroundColor: this.getStatusColor(apt.status),
            borderColor: this.getStatusColor(apt.status),
            extendedProps: {
              patientName: apt.patientName,
              doctorName: apt.doctorName,
              department: apt.department,
              status: apt.status
            }
          }))
        };
        this.cdr.detectChanges();
      },
      error: () => console.error('Failed to load all appointments')
    });
  }

  handleEventClick(info: any): void {
    const event = info.event;
    alert(`Appointment Details:\n\nPatient: ${event.title}\nDoctor: ${event.extendedProps.doctorName}\nStatus: ${event.extendedProps.status}\nTime: ${event.start.toLocaleString()}`);
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

  private renderSummaryCharts(): void {
    if (!this.stats) return;

    this.destroyChartById('adminBar');

    const barEl = document.getElementById('adminBar') as HTMLCanvasElement;
    if (barEl) {
      const chart = new Chart(barEl, {
        type: 'bar',
        data: {
          labels: ['Appointments', 'Encounters', 'Consultations', 'Bills'],
          datasets: [
            {
              label: 'Today',
              data: [this.stats.totalAppointmentsToday, this.stats.totalEncountersToday, this.stats.todayConsultations, this.stats.todayBills],
              backgroundColor: '#4f46e5',
              borderRadius: 6
            },
            {
              label: 'Total',
              data: [this.stats.totalAppointments, this.stats.totalEncounters, this.stats.totalConsultations, this.stats.totalBills],
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

  private renderTrendChart(): void {
    if (!this.trendData) return;
    this.destroyChartById('trendLineChart');

    const el = document.getElementById('trendLineChart') as HTMLCanvasElement;
    if (!el) return;

    const chart = new Chart(el, {
      type: 'line',
      data: {
        labels: this.trendData.labels,
        datasets: [
          {
            label: 'Patient Registrations',
            data: this.trendData.patientRegistrations,
            borderColor: '#4f46e5',
            backgroundColor: 'rgba(79, 70, 229, 0.08)',
            fill: true,
            tension: 0.3,
            pointRadius: 4,
            pointBackgroundColor: '#4f46e5',
            borderWidth: 2
          },
          {
            label: 'Appointments',
            data: this.trendData.appointments,
            borderColor: '#059669',
            backgroundColor: 'rgba(5, 150, 105, 0.08)',
            fill: true,
            tension: 0.3,
            pointRadius: 4,
            pointBackgroundColor: '#059669',
            borderWidth: 2
          },
          {
            label: 'Consultations',
            data: this.trendData.consultations,
            borderColor: '#d97706',
            backgroundColor: 'rgba(217, 119, 6, 0.08)',
            fill: true,
            tension: 0.3,
            pointRadius: 4,
            pointBackgroundColor: '#d97706',
            borderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { position: 'top', labels: { font: { size: 11 }, usePointStyle: true, pointStyle: 'circle' } },
          tooltip: { mode: 'index', intersect: false }
        },
        scales: {
          y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: 'rgba(0,0,0,0.04)' } },
          x: { grid: { display: false } }
        }
      }
    });
    this.charts.push(chart);
  }

  private renderRevenueChart(): void {
    if (!this.revenueData) return;
    this.destroyChartById('revenueLineChart');

    const el = document.getElementById('revenueLineChart') as HTMLCanvasElement;
    if (!el) return;

    const chart = new Chart(el, {
      type: 'line',
      data: {
        labels: this.revenueData.labels,
        datasets: [{
          label: 'Revenue',
          data: this.revenueData.revenueData,
          borderColor: '#059669',
          backgroundColor: 'rgba(5, 150, 105, 0.12)',
          fill: true,
          tension: 0.3,
          pointRadius: 4,
          pointBackgroundColor: '#059669',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', labels: { font: { size: 11 }, usePointStyle: true, pointStyle: 'circle' } },
          tooltip: {
            callbacks: {
              label: (ctx) => `Revenue: INR ${Number(ctx.raw).toLocaleString('en-IN')}`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(0,0,0,0.04)' },
            ticks: { callback: (value) => `INR ${Number(value).toLocaleString('en-IN')}` }
          },
          x: { grid: { display: false } }
        }
      }
    });
    this.charts.push(chart);
  }

  private renderEncounterStatusChart(): void {
    if (!this.encounterStatusData) return;
    this.destroyChartById('encounterStatusChart');

    const el = document.getElementById('encounterStatusChart') as HTMLCanvasElement;
    if (!el) return;

    const chart = new Chart(el, {
      type: 'doughnut',
      data: {
        labels: this.encounterStatusData.labels,
        datasets: [{
          data: this.encounterStatusData.data,
          backgroundColor: ['#667eea', '#66BB6A', '#FFA726', '#EF5350', '#42A5F5'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { font: { size: 11 }, padding: 12, usePointStyle: true }
          },
          tooltip: {
            callbacks: {
              label: (ctx: any) => {
                const total = this.encounterStatusData!.data.reduce((a: number, b: number) => a + b, 0);
                const percentage = ((ctx.parsed / total) * 100).toFixed(1);
                return `${ctx.label}: ${ctx.parsed} (${percentage}%)`;
              }
            }
          }
        }
      }
    });
    this.charts.push(chart);
  }

  private renderDepartmentChart(): void {
    if (!this.departmentStatsData) return;
    this.destroyChartById('departmentChart');

    const el = document.getElementById('departmentChart') as HTMLCanvasElement;
    if (!el) return;

    const chart = new Chart(el, {
      type: 'bar',
      data: {
        labels: this.departmentStatsData.departments,
        datasets: [{
          label: 'Appointments',
          data: this.departmentStatsData.appointmentCounts,
          backgroundColor: '#667eea',
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx: any) => `Appointments: ${ctx.parsed.y}`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1 },
            grid: { color: 'rgba(0,0,0,0.04)' }
          },
          x: { grid: { display: false } }
        }
      }
    });
    this.charts.push(chart);
  }

  private destroyChartById(canvasId: string): void {
    const idx = this.charts.findIndex(c => (c.canvas as HTMLCanvasElement)?.id === canvasId);
    if (idx !== -1) {
      this.charts[idx].destroy();
      this.charts.splice(idx, 1);
    }
  }

  private destroyCharts(): void {
    this.charts.forEach(c => c.destroy());
    this.charts = [];
  }

  private formatDate(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
