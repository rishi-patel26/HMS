import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subject, forkJoin, takeUntil } from 'rxjs';

import { BedManagementService } from '@core/services/bed-management.service';
import {
  BedAllocationRequestItem,
  BedAssignmentItem,
  BedCalendarDay,
  BedItem,
  WardItem,
} from '@core/models/hms.model';

interface CalendarCell {
  date: Date;
  inCurrentMonth: boolean;
  metrics: BedCalendarDay | null;
  isToday: boolean;
}

@Component({
  selector: 'app-bed-manager-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink],
  template: `
<div class="bm-root">

  <!-- ── TOP BAR ── -->
  <header class="bm-header">
    <div class="bm-header-left">
      <div class="bm-header-icon"><i class="pi pi-building"></i></div>
      <div>
        <h1 class="bm-title">Bed Manager Dashboard</h1>
        <p class="bm-subtitle">Real-time bed census &amp; allocation overview</p>
      </div>
    </div>
    <div class="bm-header-right">
      <span class="bm-date-chip">
        <i class="pi pi-clock"></i>
        {{ now | date:'EEE, d MMM yyyy · h:mm a' }}
      </span>
      <a routerLink="/bed-manager/management" class="bm-cta-btn">
        <i class="pi pi-wrench"></i> Manage Workspace
      </a>
      <button class="bm-refresh-btn" [disabled]="loading" (click)="reload()">
        <i class="pi" [class.pi-refresh]="!loading" [class.pi-spin]="loading" [class.pi-spinner]="loading"></i>
      </button>
    </div>
  </header>

  @if (errorMessage) {
    <div class="bm-error-bar">
      <i class="pi pi-exclamation-triangle"></i>
      {{ errorMessage }}
      <button (click)="reload()">Retry</button>
    </div>
  }

  <!-- ── KPI STRIP ── -->
  <section class="kpi-strip">
    <div class="kpi-card kpi-total">
      <div class="kpi-icon-wrap"><i class="pi pi-th-large"></i></div>
      <div class="kpi-body">
        <span class="kpi-label">Total Beds</span>
        <span class="kpi-value">{{ loading ? '—' : totalBeds }}</span>
      </div>
    </div>
    <div class="kpi-card kpi-avail">
      <div class="kpi-icon-wrap"><i class="pi pi-check-circle"></i></div>
      <div class="kpi-body">
        <span class="kpi-label">Available</span>
        <span class="kpi-value">{{ loading ? '—' : availableBeds }}</span>
        <span class="kpi-sub">{{ availablePct }}% free</span>
      </div>
    </div>
    <div class="kpi-card kpi-occ">
      <div class="kpi-icon-wrap"><i class="pi pi-user"></i></div>
      <div class="kpi-body">
        <span class="kpi-label">Occupied</span>
        <span class="kpi-value">{{ loading ? '—' : occupiedBeds }}</span>
        <span class="kpi-sub">{{ occupiedPct }}% occ.</span>
      </div>
    </div>
    <div class="kpi-card kpi-maint">
      <div class="kpi-icon-wrap"><i class="pi pi-wrench"></i></div>
      <div class="kpi-body">
        <span class="kpi-label">Maintenance</span>
        <span class="kpi-value">{{ loading ? '—' : maintenanceBeds }}</span>
      </div>
    </div>
    <div class="kpi-card kpi-queue">
      <div class="kpi-icon-wrap"><i class="pi pi-list"></i></div>
      <div class="kpi-body">
        <span class="kpi-label">Pending Requests</span>
        <span class="kpi-value">{{ loading ? '—' : pendingQueue.length }}</span>
        @if (emergencyCount > 0) {
          <span class="kpi-alert"><i class="pi pi-exclamation-circle"></i> {{ emergencyCount }} emergency</span>
        }
      </div>
    </div>
    <div class="kpi-card kpi-active">
      <div class="kpi-icon-wrap"><i class="pi pi-heart"></i></div>
      <div class="kpi-body">
        <span class="kpi-label">Active Patients</span>
        <span class="kpi-value">{{ loading ? '—' : activeAssignments.length }}</span>
      </div>
    </div>
  </section>

  <!-- ── MAIN GRID ── -->
  <div class="bm-main-grid">

    <!-- LEFT COLUMN: Queue + Active Assignments -->
    <div class="bm-col-left">

      <!-- Priority Queue -->
      
      <!-- Active Assignments -->
      <section class="bm-panel">
        <div class="panel-hd">
          <span class="panel-hd-icon assign-hd-icon"><i class="pi pi-heart"></i></span>
          <h2>Active Patients</h2>
          <span class="panel-badge panel-badge-green">{{ activeAssignments.length }}</span>
        </div>

        @if (loading) {
          <div class="panel-skeleton">
            @for (i of [1,2,3,4]; track i) { <div class="skeleton-row"></div> }
          </div>
        } @else if (activeAssignments.length === 0) {
          <div class="panel-empty">
            <i class="pi pi-user"></i>
            <span>No active patient assignments</span>
          </div>
        } @else {
          <div class="assign-table-wrap">
            <table class="assign-table">
              <thead>
                <tr>
                  <th>Encounter</th>
                  <th>Bed</th>
                  <th>Ward</th>
                  <th>Status</th>
                  <th>Since</th>
                </tr>
              </thead>
              <tbody>
                @for (a of activeAssignments; track a.id) {
                  <tr>
                    <td class="mono">{{ a.encounterId }}</td>
                    <td><span class="bed-badge">{{ a.bedNumber }}</span></td>
                    <td class="ward-cell">{{ a.wardName }}</td>
                    <td>
                      <span class="asgn-chip asgn-{{ a.status.toLowerCase() }}">
                        <i class="pi" [class.pi-clock]="a.status==='ALLOCATED'" [class.pi-check]="a.status==='ADMITTED'"></i>
                        {{ a.status | titlecase }}
                      </span>
                    </td>
                    <td class="muted">{{ timeAgo(a.assignedAt) }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </section>
    </div>

    <!-- RIGHT COLUMN: Ward Grid + Calendar -->
    <div class="bm-col-right">


    
      <!-- Calendar -->
      <section class="bm-panel cal-panel">
        <div class="panel-hd">
          <span class="panel-hd-icon cal-hd-icon"><i class="pi pi-calendar"></i></span>
          <h2>Bed Availability Calendar</h2>
          <div class="cal-nav">
            <button class="cal-nav-btn" (click)="changeMonth(-1)"><i class="pi pi-angle-left"></i></button>
            <span class="cal-month-label">{{ monthLabel }}</span>
            <button class="cal-nav-btn" (click)="changeMonth(1)"><i class="pi pi-angle-right"></i></button>
          </div>
        </div>
        <div class="cal-legend">
          <span class="cal-leg-item"><span class="cal-dot cal-dot-avail"></span> Available</span>
          <span class="cal-leg-item"><span class="cal-dot cal-dot-occ"></span> Occupied</span>
          <span class="cal-leg-item"><span class="cal-dot cal-dot-maint"></span> Maint.</span>
        </div>
        @if (calLoading) {
          <div class="panel-empty"><i class="pi pi-spin pi-spinner"></i> <span>Loading...</span></div>
        } @else {
          <div class="cal-monthly-summary">
            <span class="cms-chip cms-avail"><strong>{{ avgAvailable }}</strong> avg avail.</span>
            <span class="cms-chip cms-occ"><strong>{{ avgOccupied }}</strong> avg occ.</span>
            <span class="cms-chip cms-maint"><strong>{{ avgMaintenance }}</strong> avg maint.</span>
          </div>
          <div class="bm-cal">
            @for (d of weekdays; track d) {
              <div class="bm-cal-wd">{{ d }}</div>
            }
            @for (cell of calendarCells; track cell.date.getTime()) {
              <div class="bm-cal-cell"
                [class.bm-cal-outside]="!cell.inCurrentMonth"
                [class.bm-cal-today]="cell.isToday"
                [class.bm-cal-full]="cell.metrics && cell.metrics.availableBeds === 0 && cell.inCurrentMonth">
                <span class="bm-cal-num">{{ cell.date.getDate() }}</span>
                @if (cell.metrics && cell.inCurrentMonth) {
                  <div class="bm-cal-metrics">
                    <span class="cm-chip cm-a">{{ cell.metrics.availableBeds }}</span>
                    <span class="cm-chip cm-o">{{ cell.metrics.occupiedBeds }}</span>
                    @if (cell.metrics.maintenanceBeds > 0) {
                      <span class="cm-chip cm-m">{{ cell.metrics.maintenanceBeds }}</span>
                    }
                  </div>
                }
              </div>
            }
          </div>
        }
      </section>

    </div>
  </div>
</div>
  `,
  styles: [`
    /* ── Root ── */
    .bm-root { font-family: 'Inter', -apple-system, sans-serif; background: #f1f5f9; min-height: 100vh; padding: 0 0 2rem; }

    /* ── Header ── */
    .bm-header {
      display: flex; justify-content: space-between; align-items: center;
      background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%);
      padding: 1rem 1.5rem; gap: 1rem; flex-wrap: wrap;
      border-radius: 0 0 16px 16px; margin-bottom: 1.25rem;
    }
    .bm-header-left { display: flex; align-items: center; gap: 0.75rem; }
    .bm-header-icon {
      width: 40px; height: 40px; background: rgba(255,255,255,0.12); border-radius: 10px;
      display: flex; align-items: center; justify-content: center; font-size: 1.1rem; color: #fff;
    }
    .bm-title { margin: 0; font-size: 1.1rem; font-weight: 700; color: #fff; }
    .bm-subtitle { margin: 0; font-size: 0.75rem; color: #93c5fd; }
    .bm-header-right { display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap; }
    .bm-date-chip {
      display: inline-flex; align-items: center; gap: 0.35rem;
      background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.15);
      color: #e0e7ff; font-size: 0.72rem; border-radius: 999px; padding: 0.25rem 0.65rem;
    }
    .bm-cta-btn {
      display: inline-flex; align-items: center; gap: 0.35rem;
      background: #3b82f6; color: #fff; border: none; border-radius: 8px;
      padding: 0.4rem 0.9rem; font-size: 0.78rem; font-weight: 600;
      cursor: pointer; text-decoration: none; transition: background 0.15s;
    }
    .bm-cta-btn:hover { background: #2563eb; }
    .bm-refresh-btn {
      width: 34px; height: 34px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2);
      background: rgba(255,255,255,0.08); color: #e0e7ff; cursor: pointer;
      display: flex; align-items: center; justify-content: center; font-size: 0.85rem;
      transition: background 0.15s;
    }
    .bm-refresh-btn:hover:not(:disabled) { background: rgba(255,255,255,0.15); }
    .bm-refresh-btn:disabled { opacity: 0.4; cursor: not-allowed; }

    /* ── Error bar ── */
    .bm-error-bar {
      background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px;
      padding: 0.65rem 1rem; margin: 0 1.5rem 1rem; color: #991b1b;
      font-size: 0.82rem; display: flex; align-items: center; gap: 0.5rem;
    }
    .bm-error-bar button { margin-left: auto; background: #fee2e2; border: 1px solid #fca5a5; color: #991b1b; border-radius: 6px; padding: 0.2rem 0.6rem; cursor: pointer; font-size: 0.75rem; }

    /* ── KPI Strip ── */
    .kpi-strip {
      display: grid; grid-template-columns: repeat(6, 1fr); gap: 0.75rem;
      padding: 0 1.5rem; margin-bottom: 1.25rem;
    }
    .kpi-card {
      background: #fff; border-radius: 14px; padding: 0.9rem 1rem;
      display: flex; align-items: center; gap: 0.75rem;
      border: 1px solid #e2e8f0; box-shadow: 0 1px 4px rgba(0,0,0,0.04);
      transition: box-shadow 0.15s, transform 0.15s;
    }
    .kpi-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.08); transform: translateY(-1px); }
    .kpi-icon-wrap {
      width: 40px; height: 40px; border-radius: 10px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center; font-size: 1rem;
    }
    .kpi-total .kpi-icon-wrap { background: #ede9fe; color: #6d28d9; }
    .kpi-avail .kpi-icon-wrap  { background: #dcfce7; color: #15803d; }
    .kpi-occ .kpi-icon-wrap    { background: #fee2e2; color: #b91c1c; }
    .kpi-maint .kpi-icon-wrap  { background: #fef3c7; color: #b45309; }
    .kpi-queue .kpi-icon-wrap  { background: #dbeafe; color: #1d4ed8; }
    .kpi-active .kpi-icon-wrap { background: #fce7f3; color: #9d174d; }
    .kpi-body { display: flex; flex-direction: column; gap: 0.05rem; min-width: 0; }
    .kpi-label { font-size: 0.68rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.04em; }
    .kpi-value { font-size: 1.45rem; font-weight: 800; color: #0f172a; line-height: 1.1; }
    .kpi-sub   { font-size: 0.68rem; color: #64748b; }
    .kpi-alert { font-size: 0.68rem; color: #dc2626; font-weight: 700; display: flex; align-items: center; gap: 0.2rem; }

    /* ── Main Grid ── */
    .bm-main-grid {
      display: grid; grid-template-columns: 1fr 1.4fr; gap: 1rem;
      padding: 0 1.5rem;
    }
    .bm-col-left, .bm-col-right { display: flex; flex-direction: column; gap: 1rem; }

    /* ── Panel ── */
    .bm-panel {
      background: #fff; border-radius: 16px; padding: 1.1rem 1.2rem;
      border: 1px solid #e2e8f0; box-shadow: 0 1px 4px rgba(0,0,0,0.04);
    }
    .panel-hd {
      display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.9rem; flex-wrap: wrap;
    }
    .panel-hd h2 { margin: 0; font-size: 0.88rem; font-weight: 700; color: #1e293b; flex: 1; }
    .panel-hd-icon {
      width: 28px; height: 28px; border-radius: 8px;
      display: flex; align-items: center; justify-content: center; font-size: 0.8rem; flex-shrink: 0;
    }
    .queue-hd-icon  { background: #dbeafe; color: #1d4ed8; }
    .assign-hd-icon { background: #fce7f3; color: #9d174d; }
    .ward-hd-icon   { background: #dcfce7; color: #15803d; }
    .break-hd-icon  { background: #ede9fe; color: #6d28d9; }
    .cal-hd-icon    { background: #fef3c7; color: #b45309; }
    .panel-badge {
      border-radius: 999px; font-size: 0.68rem; font-weight: 800;
      padding: 0.12rem 0.5rem; border: 1px solid transparent;
    }
    .panel-badge-orange { background: #fff7ed; color: #c2410c; border-color: #fed7aa; }
    .panel-badge-green  { background: #dcfce7; color: #166534; border-color: #bbf7d0; }
    .panel-link {
      font-size: 0.72rem; color: #3b82f6; text-decoration: none; white-space: nowrap;
      font-weight: 600;
    }
    .panel-link:hover { text-decoration: underline; }
    .panel-empty {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 0.4rem; padding: 1.5rem; color: #94a3b8; font-size: 0.82rem; text-align: center;
    }
    .panel-empty i { font-size: 1.4rem; }

    /* ── Skeleton ── */
    .panel-skeleton { display: flex; flex-direction: column; gap: 0.5rem; }
    .skeleton-row {
      height: 52px; background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
      background-size: 200% 100%; border-radius: 10px;
      animation: shimmer 1.4s infinite;
    }
    @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
    .ward-skeleton { height: 90px; border-radius: 12px; background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; }

    /* ── Queue cards ── */
    .queue-list { display: flex; flex-direction: column; gap: 0.45rem; max-height: 320px; overflow-y: auto; }
    .queue-card {
      display: flex; justify-content: space-between; align-items: center; gap: 0.75rem;
      padding: 0.6rem 0.75rem; border-radius: 10px; border: 1px solid #e2e8f0;
      background: #fafafa; transition: border-color 0.12s, background 0.12s;
    }
    .queue-card:hover { border-color: #cbd5e1; background: #f8fafc; }
    .qc-emergency { border-left: 3px solid #ef4444 !important; background: #fff5f5 !important; }
    .qc-urgent    { border-left: 3px solid #f59e0b !important; background: #fffbeb !important; }
    .qc-left  { display: flex; align-items: center; gap: 0.6rem; min-width: 0; }
    .qc-right { display: flex; align-items: center; gap: 0.4rem; flex-shrink: 0; flex-wrap: wrap; }
    .priority-dot { width: 9px; height: 9px; border-radius: 999px; flex-shrink: 0; }
    .dot-emergency { background: #ef4444; box-shadow: 0 0 0 3px rgba(239,68,68,0.2); }
    .dot-urgent    { background: #f59e0b; box-shadow: 0 0 0 3px rgba(245,158,11,0.2); }
    .dot-normal    { background: #3b82f6; }
    .qc-info { display: flex; flex-direction: column; min-width: 0; }
    .qc-patient { font-size: 0.8rem; font-weight: 700; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .qc-enc { font-size: 0.68rem; color: #94a3b8; }
    .qc-type-chip {
      font-size: 0.65rem; font-weight: 700; padding: 0.12rem 0.4rem; border-radius: 6px;
      background: #ede9fe; color: #6d28d9; border: 1px solid #ddd6fe;
    }
    .qc-status-chip { font-size: 0.65rem; font-weight: 700; padding: 0.12rem 0.4rem; border-radius: 6px; }
    .qcs-requested    { background: #fef9c3; color: #854d0e; border: 1px solid #fde68a; }
    .qcs-under_review { background: #dbeafe; color: #1e40af; border: 1px solid #bfdbfe; }
    .qc-age { font-size: 0.65rem; color: #94a3b8; white-space: nowrap; }

    /* ── Assignments table ── */
    .assign-table-wrap { overflow-x: auto; max-height: 300px; }
    .assign-table { width: 100%; border-collapse: collapse; font-size: 0.78rem; }
    .assign-table th {
      text-align: left; padding: 0.4rem 0.6rem; font-size: 0.67rem;
      font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.04em;
      background: #f8fafc; border-bottom: 2px solid #e2e8f0; white-space: nowrap; position: sticky; top: 0;
    }
    .assign-table td { padding: 0.5rem 0.6rem; border-bottom: 1px solid #f1f5f9; color: #334155; }
    .assign-table tr:last-child td { border-bottom: none; }
    .assign-table tr:hover td { background: #f8fafc; }
    .mono { font-family: monospace; font-size: 0.73rem; color: #475569; }
    .bed-badge {
      display: inline-block; background: #f1f5f9; border: 1px solid #e2e8f0;
      border-radius: 6px; padding: 0.1rem 0.4rem; font-weight: 700; font-family: monospace; font-size: 0.75rem;
    }
    .ward-cell { color: #475569; font-size: 0.76rem; }
    .muted { color: #94a3b8; font-size: 0.72rem; }
    .asgn-chip {
      display: inline-flex; align-items: center; gap: 0.25rem; border-radius: 999px;
      padding: 0.15rem 0.5rem; font-size: 0.66rem; font-weight: 700;
    }
    .asgn-allocated { background: #dbeafe; color: #1e40af; }
    .asgn-admitted  { background: #dcfce7; color: #166534; }

    /* ── Ward Grid ── */
    .ward-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 0.65rem; }
    .ward-tile {
      border: 1px solid #e2e8f0; border-radius: 12px; padding: 0.8rem 0.9rem;
      position: relative; transition: box-shadow 0.15s; background: #fafafa;
    }
    .ward-tile:hover { box-shadow: 0 3px 12px rgba(0,0,0,0.07); }
    .ward-critical { border-left: 3px solid #ef4444; background: #fff5f5; }
    .ward-high     { border-left: 3px solid #f59e0b; background: #fffbeb; }
    .ward-tile-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem; gap: 0.4rem; }
    .ward-name-wrap { display: flex; flex-direction: column; gap: 0.15rem; min-width: 0; }
    .ward-name { font-size: 0.82rem; font-weight: 700; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .ward-type-tag {
      font-size: 0.62rem; background: #f1f5f9; color: #475569;
      border-radius: 4px; padding: 0.08rem 0.35rem; border: 1px solid #e2e8f0; display: inline-block; width: fit-content;
    }
    .ward-pct { font-size: 0.92rem; font-weight: 800; flex-shrink: 0; }
    .pct-ok   { color: #16a34a; }
    .pct-warn { color: #d97706; }
    .pct-crit { color: #dc2626; }
    .ward-beds-row { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.45rem; font-size: 0.72rem; }
    .wbr-item { display: flex; align-items: center; gap: 0.2rem; font-weight: 700; }
    .wbr-occ  { color: #b91c1c; }
    .wbr-free { color: #15803d; }
    .wbr-item i { font-size: 0.62rem; }
    .wbr-total { color: #94a3b8; font-size: 0.68rem; margin-left: auto; }
    .ward-track { height: 5px; background: #e2e8f0; border-radius: 999px; overflow: hidden; }
    .ward-fill  { height: 5px; border-radius: 999px; transition: width 0.5s ease; }
    .wf-ok   { background: linear-gradient(90deg, #4ade80, #16a34a); }
    .wf-warn { background: linear-gradient(90deg, #fcd34d, #d97706); }
    .wf-crit { background: linear-gradient(90deg, #f87171, #dc2626); }
    .ward-inactive-badge {
      position: absolute; top: 0.4rem; right: 0.4rem;
      font-size: 0.6rem; background: #f1f5f9; color: #94a3b8; border-radius: 4px; padding: 0.08rem 0.3rem; border: 1px solid #e2e8f0;
    }

    /* ── Breakdown panel ── */
    .breakdown-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 0.65rem; }
    .bt-card { border: 1px solid #e2e8f0; border-radius: 10px; padding: 0.7rem 0.8rem; background: #fafafa; }
    .bt-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.55rem; }
    .bt-type { font-size: 0.7rem; font-weight: 800; border-radius: 6px; padding: 0.12rem 0.45rem; }
    .bt-icu     { background: #ede9fe; color: #6d28d9; }
    .bt-general { background: #dbeafe; color: #1e40af; }
    .bt-private { background: #fce7f3; color: #9d174d; }
    .bt-total { font-size: 0.68rem; color: #94a3b8; font-weight: 600; }
    .bt-bars { display: flex; flex-direction: column; gap: 0.3rem; }
    .bt-bar-row { display: flex; align-items: center; gap: 0.4rem; }
    .bt-bar-label { font-size: 0.63rem; color: #94a3b8; width: 44px; flex-shrink: 0; }
    .bt-bar-track { flex: 1; height: 5px; background: #e2e8f0; border-radius: 999px; overflow: hidden; }
    .bt-bar-fill  { height: 5px; border-radius: 999px; transition: width 0.5s ease; min-width: 2px; }
    .bt-avail-fill { background: #22c55e; }
    .bt-occ-fill   { background: #ef4444; }
    .bt-maint-fill { background: #f59e0b; }
    .bt-bar-val { font-size: 0.65rem; font-weight: 700; color: #334155; width: 16px; text-align: right; }

    /* ── Calendar ── */
    .cal-nav { display: flex; align-items: center; gap: 0.35rem; }
    .cal-nav-btn {
      width: 26px; height: 26px; border: 1px solid #e2e8f0; border-radius: 7px;
      background: #f8fafc; display: flex; align-items: center; justify-content: center;
      cursor: pointer; font-size: 0.8rem; color: #475569; transition: background 0.12s;
    }
    .cal-nav-btn:hover { background: #e2e8f0; }
    .cal-month-label { font-size: 0.78rem; font-weight: 700; color: #1e293b; min-width: 120px; text-align: center; }
    .cal-legend { display: flex; gap: 0.75rem; margin-bottom: 0.65rem; flex-wrap: wrap; }
    .cal-leg-item { display: flex; align-items: center; gap: 0.3rem; font-size: 0.68rem; color: #64748b; }
    .cal-dot { width: 8px; height: 8px; border-radius: 999px; display: inline-block; }
    .cal-dot-avail { background: #22c55e; }
    .cal-dot-occ   { background: #ef4444; }
    .cal-dot-maint { background: #f59e0b; }
    .cal-monthly-summary { display: flex; gap: 0.5rem; margin-bottom: 0.65rem; flex-wrap: wrap; }
    .cms-chip { font-size: 0.68rem; font-weight: 600; padding: 0.18rem 0.55rem; border-radius: 999px; }
    .cms-avail { background: #dcfce7; color: #166534; }
    .cms-occ   { background: #fee2e2; color: #991b1b; }
    .cms-maint { background: #fef3c7; color: #92400e; }
    .bm-cal { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; }
    .bm-cal-wd { background: #f8fafc; padding: 0.35rem; text-align: center; font-size: 0.65rem; font-weight: 700; color: #64748b; border-bottom: 1px solid #e2e8f0; }
    .bm-cal-cell {
      min-height: 72px; border-right: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9;
      padding: 0.3rem 0.35rem; transition: background 0.12s;
    }
    .bm-cal-cell:nth-child(7n) { border-right: none; }
    .bm-cal-outside { background: #f8fafc; }
    .bm-cal-today { background: #eff6ff !important; box-shadow: inset 0 0 0 2px #3b82f6; }
    .bm-cal-full { background: #fff5f5; }
    .bm-cal-num { font-size: 0.72rem; font-weight: 700; color: #334155; display: block; margin-bottom: 0.25rem; }
    .bm-cal-outside .bm-cal-num { color: #cbd5e1; }
    .bm-cal-today .bm-cal-num { color: #1d4ed8; }
    .bm-cal-metrics { display: flex; gap: 0.18rem; flex-wrap: wrap; }
    .cm-chip { font-size: 0.58rem; font-weight: 800; padding: 0.07rem 0.28rem; border-radius: 4px; }
    .cm-a { background: #dcfce7; color: #166534; }
    .cm-o { background: #fee2e2; color: #991b1b; }
    .cm-m { background: #fef3c7; color: #92400e; }

    /* ── Responsive ── */
    @media (max-width: 1280px) {
      .kpi-strip { grid-template-columns: repeat(3, 1fr); }
    }
    @media (max-width: 1024px) {
      .bm-main-grid { grid-template-columns: 1fr; }
      .kpi-strip { grid-template-columns: repeat(3, 1fr); }
    }
    @media (max-width: 640px) {
      .bm-header { padding: 0.75rem 1rem; }
      .kpi-strip { grid-template-columns: repeat(2, 1fr); padding: 0 1rem; }
      .bm-main-grid { padding: 0 1rem; }
    }
  `]
})
export class BedManagerDashboardComponent implements OnInit, OnDestroy {

  // ── Data ──────────────────────────────────────────────────────────────────
  wards: WardItem[] = [];
  allBedItems: BedItem[] = [];
  pendingQueue: BedAllocationRequestItem[] = [];
  activeAssignments: BedAssignmentItem[] = [];

  // ── KPIs ──────────────────────────────────────────────────────────────────
  get totalBeds() { return this.allBedItems.length; }
  get availableBeds() { return this.allBedItems.filter(b => b.status === 'AVAILABLE').length; }
  get occupiedBeds() { return this.allBedItems.filter(b => b.status === 'OCCUPIED').length; }
  get maintenanceBeds() { return this.allBedItems.filter(b => b.status === 'MAINTENANCE').length; }
  get availablePct() { return this.totalBeds ? Math.round((this.availableBeds / this.totalBeds) * 100) : 0; }
  get occupiedPct() { return this.totalBeds ? Math.round((this.occupiedBeds / this.totalBeds) * 100) : 0; }
  get emergencyCount() { return this.pendingQueue.filter(r => r.priority === 'EMERGENCY').length; }

  // ── Bed-type breakdown ────────────────────────────────────────────────────
  get bedTypeBreakdown() {
    const types: Array<'ICU' | 'GENERAL' | 'PRIVATE'> = ['ICU', 'GENERAL', 'PRIVATE'];
    return types
      .map(type => ({
        type,
        total: this.allBedItems.filter(b => b.bedType === type).length,
        available: this.allBedItems.filter(b => b.bedType === type && b.status === 'AVAILABLE').length,
        occupied: this.allBedItems.filter(b => b.bedType === type && b.status === 'OCCUPIED').length,
        maintenance: this.allBedItems.filter(b => b.bedType === type && b.status === 'MAINTENANCE').length,
      }))
      .filter(bt => bt.total > 0);
  }

  // ── Calendar ──────────────────────────────────────────────────────────────
  weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  selectedMonth = new Date().getMonth() + 1;
  selectedYear = new Date().getFullYear();
  monthLabel = '';
  calendarCells: CalendarCell[] = [];
  avgAvailable = 0;
  avgOccupied = 0;
  avgMaintenance = 0;

  // ── State ─────────────────────────────────────────────────────────────────
  loading = false;
  calLoading = false;
  errorMessage = '';
  now = new Date();

  private destroy$ = new Subject<void>();

  constructor(
    private readonly svc: BedManagementService,
    private readonly cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void { this.reload(); }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  reload(): void {
    this.loading = true;
    this.errorMessage = '';
    this.now = new Date();

    forkJoin({
      beds: this.svc.getAllBeds(),
      wards: this.svc.getWardOccupancy(),
      queue: this.svc.getPriorityQueue(),
      assignments: this.svc.getActiveAssignments(),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ beds, wards, queue, assignments }) => {
          this.allBedItems = beds;
          this.wards = wards;
          this.pendingQueue = queue;
          this.activeAssignments = assignments;
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.errorMessage = err?.error?.message || 'Failed to load dashboard data.';
          this.loading = false;
          this.cdr.markForCheck();
        },
      });

    this.loadCalendar();
  }

  changeMonth(offset: number): void {
    const d = new Date(this.selectedYear, this.selectedMonth - 1 + offset, 1);
    this.selectedYear = d.getFullYear();
    this.selectedMonth = d.getMonth() + 1;
    this.loadCalendar();
  }

  private loadCalendar(): void {
    this.calLoading = true;
    this.svc.getMonthlyCalendar(this.selectedYear, this.selectedMonth)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.monthLabel = new Date(this.selectedYear, this.selectedMonth - 1, 1)
            .toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
          this.buildCalendar(data);
          this.calLoading = false;
          this.cdr.markForCheck();
        },
        error: () => { this.calLoading = false; this.cdr.markForCheck(); },
      });
  }

  private buildCalendar(metrics: BedCalendarDay[]): void {
    const byDate = new Map(metrics.map(m => [m.date.slice(0, 10), m]));
    const first = new Date(this.selectedYear, this.selectedMonth - 1, 1);
    const last = new Date(this.selectedYear, this.selectedMonth, 0);
    const today = new Date();
    const cells: CalendarCell[] = [];

    for (let i = 0; i < first.getDay(); i++) {
      const d = new Date(this.selectedYear, this.selectedMonth - 1, 1 - (first.getDay() - i));
      cells.push({ date: d, inCurrentMonth: false, metrics: null, isToday: this.sameDay(d, today) });
    }
    for (let day = 1; day <= last.getDate(); day++) {
      const d = new Date(this.selectedYear, this.selectedMonth - 1, day);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      cells.push({ date: d, inCurrentMonth: true, metrics: byDate.get(key) ?? null, isToday: this.sameDay(d, today) });
    }
    while (cells.length % 7 !== 0) {
      const n = cells.length - (first.getDay() + last.getDate()) + 1;
      const d = new Date(this.selectedYear, this.selectedMonth, n);
      cells.push({ date: d, inCurrentMonth: false, metrics: null, isToday: this.sameDay(d, today) });
    }
    this.calendarCells = cells;

    const len = metrics.length || 1;
    this.avgAvailable = Math.round(metrics.reduce((s, m) => s + m.availableBeds, 0) / len);
    this.avgOccupied = Math.round(metrics.reduce((s, m) => s + m.occupiedBeds, 0) / len);
    this.avgMaintenance = Math.round(metrics.reduce((s, m) => s + m.maintenanceBeds, 0) / len);
  }

  private sameDay(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  timeAgo(isoString: string): string {
    if (!isoString) return '—';
    const diff = Date.now() - new Date(isoString).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  }
}
