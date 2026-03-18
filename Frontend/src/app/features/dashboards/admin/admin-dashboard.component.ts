import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '@core/services/auth.service';
import { DashboardService } from '@core/services/dashboard.service';
import { DashboardStats, DailyTrendResponse, RevenueTrendResponse } from '@core/models/hms.model';
import {
  Chart, BarController, LineController,
  BarElement, LineElement, PointElement,
  CategoryScale, LinearScale, Tooltip, Legend, Filler
} from 'chart.js';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
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

  // Chart instances for cleanup
  private charts: Chart[] = [];

  constructor(
    private authService: AuthService,
    private dashboardService: DashboardService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    Chart.register(
      BarController, LineController,
      BarElement, LineElement, PointElement,
      CategoryScale, LinearScale, Tooltip, Legend, Filler
    );

    this.username = this.authService.getUsername();

    // Default: last 7 days
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 6);
    this.dateTo = this.formatDate(today);
    this.dateFrom = this.formatDate(weekAgo);

    this.loadStats();
    this.loadTrends();
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
