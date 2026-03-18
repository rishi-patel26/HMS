import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BedManagementService } from '@core/services/bed-management.service';
import { BedCalendarDay } from '@core/models/hms.model';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';

interface CalendarCell {
  date: Date;
  inCurrentMonth: boolean;
  metrics: BedCalendarDay | null;
  isToday: boolean;
}

@Component({
  selector: 'app-bed-manager-dashboard',
  standalone: true,
  imports: [CommonModule, ButtonModule, CardModule, TagModule],
  template: `
    <div class="page">
      <p-card>
        <div class="page-header">
          <h1>Bed Availability Calendar</h1>
          <p>Daily bed snapshot for available, occupied, and maintenance capacity.</p>
        </div>

        <div class="toolbar">
          <button pButton type="button" icon="pi pi-angle-left" label="Previous" class="p-button-text" (click)="changeMonth(-1)"></button>
          <h2>{{ monthLabel }}</h2>
          <button pButton type="button" icon="pi pi-angle-right" iconPos="right" label="Next" class="p-button-text" (click)="changeMonth(1)"></button>
        </div>

        <div class="legend">
          <p-tag severity="success" value="Available"></p-tag>
          <p-tag severity="info" value="Occupied"></p-tag>
          <p-tag severity="danger" value="Maintenance"></p-tag>
        </div>

        @if (loading) {
          <div class="loading-state">
            <i class="pi pi-spin pi-spinner"></i>
            <span>Loading calendar...</span>
          </div>
        } @else if (errorMessage) {
          <div class="error-state">
            <i class="pi pi-exclamation-triangle"></i>
            <span>{{ errorMessage }}</span>
          </div>
        } @else {
          <div class="summary-grid">
            <div class="summary-card available">
              <span class="label">Average Available</span>
              <strong>{{ averageAvailable }}</strong>
            </div>
            <div class="summary-card occupied">
              <span class="label">Average Occupied</span>
              <strong>{{ averageOccupied }}</strong>
            </div>
            <div class="summary-card maintenance">
              <span class="label">Average Maintenance</span>
              <strong>{{ averageMaintenance }}</strong>
            </div>
          </div>

          <div class="calendar">
            @for (day of weekdays; track day) {
              <div class="weekday">{{ day }}</div>
            }

            @for (cell of calendarCells; track trackByDate(cell)) {
              <div class="cell" [class.outside]="!cell.inCurrentMonth" [class.today]="cell.isToday">
                <div class="date">{{ cell.date.getDate() }}</div>
                @if (cell.metrics; as m) {
                  <div class="metrics">
                    <span class="metric"><i class="dot available"></i>{{ m.availableBeds }}</span>
                    <span class="metric"><i class="dot occupied"></i>{{ m.occupiedBeds }}</span>
                    <span class="metric"><i class="dot maintenance"></i>{{ m.maintenanceBeds }}</span>
                  </div>
                }
              </div>
            }
          </div>
        }
      </p-card>
    </div>
  `,
  styles: [`
    .page-header { margin-bottom: 1rem; }
    .page-header h1 { margin: 0 0 0.2rem 0; color: #0f172a; }
    .page-header p { margin: 0; color: #475569; }
    .toolbar {
      display: flex; justify-content: space-between; align-items: center;
      border: 1px solid #e2e8f0; border-radius: 10px; padding: 0.4rem 0.5rem; margin-bottom: 0.8rem;
    }
    .toolbar h2 { margin: 0; font-size: 1rem; color: #1e293b; }
    .legend { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.8rem; }
    .dot { width: 8px; height: 8px; border-radius: 999px; display: inline-block; margin-right: 0.3rem; }
    .dot.available { background: #16a34a; }
    .dot.occupied { background: #2563eb; }
    .dot.maintenance { background: #dc2626; }
    .loading-state, .error-state {
      border: 1px dashed #cbd5e1; border-radius: 10px; padding: 1rem; display: flex; gap: 0.6rem; align-items: center;
      margin-bottom: 1rem;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 0.65rem;
      margin-bottom: 0.8rem;
    }
    .summary-card {
      border-radius: 10px;
      padding: 0.6rem 0.75rem;
      border: 1px solid #e2e8f0;
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }
    .summary-card .label { font-size: 0.72rem; color: #64748b; text-transform: uppercase; }
    .summary-card strong { font-size: 1.05rem; color: #0f172a; }
    .summary-card.available { background: #f0fdf4; border-color: #bbf7d0; }
    .summary-card.occupied { background: #eff6ff; border-color: #bfdbfe; }
    .summary-card.maintenance { background: #fef2f2; border-color: #fecaca; }
    .calendar {
      display: grid; grid-template-columns: repeat(7, minmax(0, 1fr));
      background: #fff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0;
    }
    .weekday {
      background: #f8fafc; padding: 0.55rem; text-align: center; font-size: 0.75rem; font-weight: 700; color: #64748b;
      border-bottom: 1px solid #e2e8f0;
    }
    .cell {
      min-height: 118px; border-right: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9;
      padding: 0.45rem;
      transition: background-color 120ms ease;
    }
    .cell:nth-child(7n) { border-right: none; }
    .cell.outside { background: #f8fafc; color: #94a3b8; }
    .cell.today { background: #eef2ff; }
    .date { font-size: 0.78rem; font-weight: 700; color: #334155; margin-bottom: 0.4rem; }
    .outside .date { color: #94a3b8; }
    .metrics { display: flex; flex-direction: column; gap: 0.24rem; }
    .metric { font-size: 0.74rem; color: #475569; display: inline-flex; align-items: center; }
    @media (max-width: 900px) {
      .cell { min-height: 100px; }
      .metric { font-size: 0.7rem; }
      .summary-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class BedManagerDashboardComponent implements OnInit {
  weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  selectedMonth = new Date().getMonth() + 1;
  selectedYear = new Date().getFullYear();

  monthLabel = '';
  averageAvailable = 0;
  averageOccupied = 0;
  averageMaintenance = 0;

  loading = false;
  errorMessage = '';

  calendarCells: CalendarCell[] = [];
  private monthlyMetrics: BedCalendarDay[] = [];
  private metricsByDate = new Map<string, BedCalendarDay>();

  constructor(
    private bedManagementService: BedManagementService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadCalendar();
  }

  changeMonth(offset: number): void {
    const current = new Date(this.selectedYear, this.selectedMonth - 1, 1);
    current.setMonth(current.getMonth() + offset);
    this.selectedYear = current.getFullYear();
    this.selectedMonth = current.getMonth() + 1;
    this.loadCalendar();
  }

  private loadCalendar(): void {
    this.loading = true;
    this.errorMessage = '';

    this.bedManagementService.getMonthlyCalendar(this.selectedYear, this.selectedMonth).subscribe({
      next: (metrics) => {
        this.monthlyMetrics = metrics;
        this.metricsByDate = new Map(metrics.map(item => [item.date.slice(0, 10), item]));
        this.monthLabel = new Date(this.selectedYear, this.selectedMonth - 1, 1)
          .toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        this.setMonthlyAverages();
        this.buildCalendarGrid();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err?.error?.message || 'Failed to load calendar data.';
        this.cdr.detectChanges();
      }
    });
  }

  private buildCalendarGrid(): void {
    const firstOfMonth = new Date(this.selectedYear, this.selectedMonth - 1, 1);
    const lastOfMonth = new Date(this.selectedYear, this.selectedMonth, 0);

    const startDay = firstOfMonth.getDay();
    const daysInMonth = lastOfMonth.getDate();

    const cells: CalendarCell[] = [];

    for (let i = 0; i < startDay; i += 1) {
      const d = new Date(this.selectedYear, this.selectedMonth - 1, 1 - (startDay - i));
      cells.push({ date: d, inCurrentMonth: false, metrics: null, isToday: this.isSameDate(d, new Date()) });
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const d = new Date(this.selectedYear, this.selectedMonth - 1, day);
      const key = this.toDateKey(d);
      const metrics = this.metricsByDate.get(key) ?? null;
      cells.push({ date: d, inCurrentMonth: true, metrics, isToday: this.isSameDate(d, new Date()) });
    }

    while (cells.length % 7 !== 0) {
      const nextDay = cells.length - (startDay + daysInMonth) + 1;
      const d = new Date(this.selectedYear, this.selectedMonth, nextDay);
      cells.push({ date: d, inCurrentMonth: false, metrics: null, isToday: this.isSameDate(d, new Date()) });
    }

    this.calendarCells = cells;
  }

  trackByDate(cell: CalendarCell): string {
    return this.toDateKey(cell.date);
  }

  private setMonthlyAverages(): void {
    if (this.monthlyMetrics.length === 0) {
      this.averageAvailable = 0;
      this.averageOccupied = 0;
      this.averageMaintenance = 0;
      return;
    }

    const totalDays = this.monthlyMetrics.length;
    const available = this.monthlyMetrics.reduce((acc, d) => acc + d.availableBeds, 0);
    const occupied = this.monthlyMetrics.reduce((acc, d) => acc + d.occupiedBeds, 0);
    const maintenance = this.monthlyMetrics.reduce((acc, d) => acc + d.maintenanceBeds, 0);

    this.averageAvailable = Math.round(available / totalDays);
    this.averageOccupied = Math.round(occupied / totalDays);
    this.averageMaintenance = Math.round(maintenance / totalDays);
  }

  private isSameDate(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear()
      && a.getMonth() === b.getMonth()
      && a.getDate() === b.getDate();
  }

  private toDateKey(date: Date): string {
    const y = date.getFullYear();
    const m = `${date.getMonth() + 1}`.padStart(2, '0');
    const d = `${date.getDate()}`.padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}
