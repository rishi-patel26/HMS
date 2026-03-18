import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	OnDestroy,
	OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, forkJoin, takeUntil } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';

import { BedManagementService } from '@core/services/bed-management.service';
import {
	BedAllocationRequestItem,
	BedAssignmentItem,
	BedItem,
	WardItem,
} from '@core/models/hms.model';

@Component({
	selector: 'app-bed-management-workspace',
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [CommonModule, ButtonModule, CardModule, TagModule],
	template: `
		<div class="page">
			<p-card>
				<div class="page-header">
					<div class="header-text">
						<h1>Bed Management Workspace</h1>
						<p>Queue-based allocation workflow for review, bed assignment, and discharge lifecycle.</p>
					</div>
					<button
						pButton
						type="button"
						icon="pi pi-refresh"
						label="Refresh"
						class="p-button-outlined p-button-sm refresh-btn"
						[disabled]="loading"
						(click)="loadDashboard()"
					></button>
				</div>

				@if (loading) {
					<div class="loading-state">
						<i class="pi pi-spin pi-spinner"></i>
						<span>Loading bed management workspace...</span>
					</div>
				} @else if (errorMessage) {
					<div class="error-state">
						<i class="pi pi-exclamation-triangle"></i>
						<span>{{ errorMessage }}</span>
						<button pButton type="button" label="Retry" class="p-button-sm" (click)="loadDashboard()"></button>
					</div>
				} @else {
					<div class="workspace-grid">

						<!-- Priority Queue -->
						<section class="panel queue-panel">
							<div class="panel-header">
								<h2>Priority Queue</h2>
								@if (queue.length > 0) {
									<span class="badge-count">{{ queue.length }}</span>
								}
							</div>

							@if (queue.length === 0) {
								<div class="empty-state">
									<i class="pi pi-inbox"></i>
									<span>No open requests.</span>
								</div>
							}

							@for (req of queue; track req.id) {
								<article class="queue-item" [class.is-emergency]="req.priority === 'EMERGENCY'">
									<div class="item-head">
										<div class="item-identity">
											<strong>{{ req.patientUhid }}</strong>
											<small>{{ req.encounterNumber }}</small>
										</div>
										<div class="chips">
											<p-tag
												[value]="req.priority"
												[styleClass]="'chip priority p-' + req.priority.toLowerCase()"
											></p-tag>
											<p-tag
												[value]="req.status"
												[styleClass]="'chip status s-' + req.status.toLowerCase()"
											></p-tag>
										</div>
									</div>

									<div class="item-meta">
										<span><i class="pi pi-bed"></i> {{ req.requiredBedType }}</span>
										@if (req.preferredWardName) {
											<span><i class="pi pi-building"></i> {{ req.preferredWardName }}</span>
										}
										@if (req.notes) {
											<span class="notes-chip"><i class="pi pi-info-circle"></i> {{ req.notes }}</span>
										}
									</div>

									@if (req.status === 'REQUESTED' || req.status === 'UNDER_REVIEW') {
										<div class="item-actions">
											<button
												pButton
												type="button"
												class="action-btn review-btn p-button-sm"
												icon="pi pi-eye"
												label="Review"
												[disabled]="req.status === 'UNDER_REVIEW'"
												(click)="markUnderReview(req)"
											></button>
											<button
												pButton
												type="button"
												class="action-btn allocate-btn p-button-sm"
												[icon]="isAllocationOpen(req.id) ? 'pi pi-times' : 'pi pi-check-circle'"
												[label]="isAllocationOpen(req.id) ? 'Close' : 'Allocate'"
												(click)="openAllocation(req)"
											></button>
											<button
												pButton
												type="button"
												class="action-btn reject-btn p-button-sm"
												icon="pi pi-ban"
												label="Reject"
												(click)="reject(req)"
											></button>
										</div>

										@if (isAllocationOpen(req.id)) {
											<div class="allocation-panel">
												<p class="allocation-label">Select a bed to allocate</p>
												@if (loadingBeds[req.id]) {
													<div class="beds-loading">
														<i class="pi pi-spin pi-spinner"></i>
														<span>Loading available beds...</span>
													</div>
												} @else if (matchingBeds(req).length === 0) {
													<div class="empty-state small">
														<i class="pi pi-exclamation-circle"></i>
														<span>No matching beds available for this request.</span>
													</div>
												} @else {
													<div class="bed-candidates">
														@for (bed of matchingBeds(req); track bed.id) {
															<button
																type="button"
																class="bed-candidate"
																(click)="allocateWithBed(req, bed)"
															>
																<span class="bed-number">{{ bed.bedNumber }}</span>
																<small>{{ bed.wardName }} · {{ bed.bedType }}</small>
															</button>
														}
													</div>
												}
											</div>
										}
									}
								</article>
							}
						</section>

						<!-- Ward Occupancy -->
						<section class="panel occupancy-panel">
							<div class="panel-header">
								<h2>Ward Occupancy</h2>
							</div>
							<div class="ward-list">
								@for (ward of wards; track ward.id) {
									<article class="ward-card">
										<div class="ward-head">
											<strong>{{ ward.name }}</strong>
											<span class="ward-type-badge">{{ ward.type }}</span>
										</div>
										<div class="ward-metrics">
											<span>{{ ward.occupiedBeds }} / {{ ward.capacity }} occupied</span>
											<span class="occupancy-pct" [class]="occupancyClass(ward.occupancyRate)">
												{{ ward.occupancyRate | number:'1.0-0' }}%
											</span>
										</div>
										<div class="progress-track">
											<div
												class="progress-fill"
												[class]="occupancyClass(ward.occupancyRate)"
												[style.width.%]="ward.occupancyRate"
											></div>
										</div>
									</article>
								}
							</div>
						</section>

						<!-- Available Beds -->
						<section class="panel beds-panel">
							<div class="panel-header">
								<h2>Available Beds</h2>
								<span class="badge-count avail">{{ availableBedCount }}</span>
							</div>
							<div class="table-wrap">
								<table>
									<thead>
										<tr>
											<th>Bed</th>
											<th>Ward</th>
											<th>Type</th>
											<th>Status</th>
										</tr>
									</thead>
									<tbody>
										@if (beds.length === 0) {
											<tr>
												<td colspan="4" class="empty-row">No beds found.</td>
											</tr>
										}
										@for (bed of beds; track bed.id) {
											<tr>
												<td class="bed-num">{{ bed.bedNumber }}</td>
												<td>{{ bed.wardName }}</td>
												<td>{{ bed.bedType }}</td>
												<td>
													<span class="status-pill" [ngClass]="'status-' + bed.status.toLowerCase()">
														{{ bed.status | titlecase }}
													</span>
												</td>
											</tr>
										}
									</tbody>
								</table>
							</div>
						</section>

						<!-- Active Assignments -->
						<section class="panel assign-panel">
							<div class="panel-header">
								<h2>Active Assignments</h2>
								<span class="badge-count">{{ assignments.length }}</span>
							</div>
							<div class="table-wrap">
								<table>
									<thead>
										<tr>
											<th>Encounter</th>
											<th>Bed / Ward</th>
											<th>Status</th>
											<th>Assigned At</th>
											<th>Actions</th>
										</tr>
									</thead>
									<tbody>
										@if (assignments.length === 0) {
											<tr>
												<td colspan="5" class="empty-row">No active assignments.</td>
											</tr>
										}
										@for (asg of assignments; track asg.id) {
											<tr>
												<td class="encounter-id">{{ asg.encounterId }}</td>
												<td>
													<span class="bed-num">{{ asg.bedNumber }}</span>
													<small class="ward-sub">{{ asg.wardName }}</small>
												</td>
												<td>
													<span class="status-pill" [ngClass]="'asg-' + asg.status.toLowerCase()">
														{{ asg.status | titlecase }}
													</span>
												</td>
												<td class="date-cell">{{ formatDateTime(asg.assignedAt) }}</td>
												<td>
													@if (asg.status === 'ALLOCATED') {
														<button
															pButton
															type="button"
															class="action-btn review-btn p-button-sm"
															icon="pi pi-user-plus"
															label="Admit"
															(click)="admit(asg)"
														></button>
													}
													@if (asg.status === 'ADMITTED') {
														<button
															pButton
															type="button"
															class="action-btn reject-btn p-button-sm"
															icon="pi pi-sign-out"
															label="Discharge"
															(click)="discharge(asg)"
														></button>
													}
												</td>
											</tr>
										}
									</tbody>
								</table>
							</div>
						</section>

					</div>
				}
			</p-card>
		</div>
	`,
	styles: [`
		/* ── Layout ── */
		.page { padding: 0; }

		.page-header {
			display: flex;
			justify-content: space-between;
			align-items: flex-start;
			margin-bottom: 1.25rem;
			gap: 1rem;
		}
		.header-text h1 { margin: 0 0 0.2rem; font-size: 1.25rem; color: #0f172a; font-weight: 700; }
		.header-text p  { margin: 0; color: #64748b; font-size: 0.85rem; }
		.refresh-btn { white-space: nowrap; }

		/* States */
		.loading-state, .error-state {
			border: 1px dashed #cbd5e1;
			border-radius: 12px;
			padding: 1.25rem 1rem;
			display: flex;
			gap: 0.75rem;
			align-items: center;
			color: #475569;
			font-size: 0.875rem;
			margin-bottom: 1rem;
		}
		.loading-state i { color: #3b82f6; }
		.error-state i   { color: #ef4444; }
		.error-state button { margin-left: auto; }

		/* Grid */
		.workspace-grid {
			display: grid;
			gap: 1rem;
			grid-template-columns: 1.4fr 1fr;
			grid-template-areas:
				'queue occupancy'
				'beds  assign';
		}
		.panel {
			background: #fff;
			border: 1px solid #e2e8f0;
			border-radius: 14px;
			padding: 1rem 1.1rem;
		}
		.queue-panel    { grid-area: queue; }
		.occupancy-panel{ grid-area: occupancy; }
		.beds-panel     { grid-area: beds; }
		.assign-panel   { grid-area: assign; }

		/* Panel header */
		.panel-header {
			display: flex;
			align-items: center;
			gap: 0.5rem;
			margin-bottom: 0.9rem;
		}
		.panel-header h2 {
			margin: 0;
			font-size: 0.93rem;
			font-weight: 700;
			color: #1e293b;
			flex: 1;
		}
		.badge-count {
			background: #f1f5f9;
			color: #475569;
			border-radius: 999px;
			font-size: 0.72rem;
			font-weight: 700;
			padding: 0.15rem 0.55rem;
			border: 1px solid #e2e8f0;
		}
		.badge-count.avail { background: #dcfce7; color: #166534; border-color: #bbf7d0; }

		/* Queue items */
		.queue-item {
			border: 1px solid #e2e8f0;
			border-radius: 10px;
			padding: 0.8rem;
			margin-bottom: 0.65rem;
			transition: border-color 0.15s, box-shadow 0.15s;
		}
		.queue-item:hover { border-color: #cbd5e1; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
		.queue-item.is-emergency { border-left: 3px solid #ef4444; }

		.item-head {
			display: flex;
			justify-content: space-between;
			align-items: flex-start;
			gap: 0.5rem;
			margin-bottom: 0.5rem;
		}
		.item-identity strong { display: block; font-size: 0.9rem; color: #0f172a; }
		.item-identity small  { display: block; font-size: 0.73rem; color: #64748b; margin-top: 0.15rem; }

		.chips { display: flex; gap: 0.3rem; flex-wrap: wrap; }
		.chip {
			border-radius: 999px;
			padding: 0.15rem 0.5rem;
			font-size: 0.67rem;
			font-weight: 700;
			border: 0 !important;
		}
		/* Priority chips */
		.p-emergency { background: #fee2e2 !important; color: #991b1b !important; }
		.p-urgent    { background: #fef3c7 !important; color: #92400e !important; }
		.p-normal    { background: #dbeafe !important; color: #1e3a8a !important; }
		/* Status chips */
		.s-requested    { background: #fef9c3 !important; color: #854d0e !important; }
		.s-under_review { background: #dbeafe !important; color: #1e40af !important; }
		.s-allocated    { background: #dcfce7 !important; color: #166534 !important; }

		/* Meta row */
		.item-meta {
			display: flex;
			flex-wrap: wrap;
			gap: 0.5rem 0.8rem;
			font-size: 0.78rem;
			color: #64748b;
			margin-bottom: 0.55rem;
		}
		.item-meta i { font-size: 0.72rem; margin-right: 0.2rem; }
		.notes-chip {
			background: #f8fafc;
			border: 1px solid #e2e8f0;
			border-radius: 6px;
			padding: 0.1rem 0.4rem;
		}

		/* Action buttons */
		.item-actions { display: flex; gap: 0.45rem; flex-wrap: wrap; }
		.action-btn { font-size: 0.78rem !important; padding: 0.3rem 0.65rem !important; border-radius: 8px !important; }
		.review-btn  { color: #1d4ed8 !important; border-color: #bfdbfe !important; background: #eff6ff !important; }
		.allocate-btn{ color: #065f46 !important; border-color: #a7f3d0 !important; background: #ecfdf5 !important; }
		.reject-btn  { color: #991b1b !important; border-color: #fecaca !important; background: #fef2f2 !important; }
		.review-btn:hover:not(:disabled)  { background: #dbeafe !important; border-color: #93c5fd !important; }
		.allocate-btn:hover:not(:disabled){ background: #d1fae5 !important; border-color: #6ee7b7 !important; }
		.reject-btn:hover:not(:disabled)  { background: #fee2e2 !important; border-color: #fca5a5 !important; }
		.action-btn:disabled { opacity: 0.5 !important; cursor: not-allowed !important; }

		/* Allocation panel */
		.allocation-panel {
			margin-top: 0.65rem;
			background: #f8fafc;
			border: 1px solid #e2e8f0;
			border-radius: 10px;
			padding: 0.65rem;
		}
		.allocation-label {
			font-size: 0.75rem;
			color: #64748b;
			font-weight: 600;
			margin: 0 0 0.5rem;
			text-transform: uppercase;
			letter-spacing: 0.04em;
		}
		.beds-loading {
			display: flex;
			align-items: center;
			gap: 0.5rem;
			color: #64748b;
			font-size: 0.8rem;
			padding: 0.25rem 0;
		}
		.bed-candidates {
			display: grid;
			grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
			gap: 0.4rem;
		}
		.bed-candidate {
			text-align: left;
			border: 1px solid #cbd5e1;
			border-radius: 8px;
			background: #fff;
			padding: 0.45rem 0.6rem;
			display: flex;
			flex-direction: column;
			gap: 0.15rem;
			cursor: pointer;
			transition: border-color 0.12s, background 0.12s;
		}
		.bed-candidate:hover { border-color: #86efac; background: #f0fdf4; }
		.bed-number { font-weight: 700; font-size: 0.85rem; color: #0f172a; }
		.bed-candidate small { color: #64748b; font-size: 0.72rem; }

		/* Empty states */
		.empty-state {
			display: flex;
			flex-direction: column;
			align-items: center;
			gap: 0.4rem;
			padding: 1.5rem 1rem;
			color: #94a3b8;
			font-size: 0.85rem;
			text-align: center;
		}
		.empty-state i { font-size: 1.5rem; }
		.empty-state.small { padding: 0.5rem; flex-direction: row; font-size: 0.8rem; justify-content: flex-start; }
		.empty-state.small i { font-size: 0.9rem; }
		.empty-row { text-align: center; color: #94a3b8; font-size: 0.82rem; padding: 1.25rem !important; }

		/* Ward cards */
		.ward-list { display: flex; flex-direction: column; gap: 0.55rem; }
		.ward-card {
			border: 1px solid #e2e8f0;
			border-radius: 10px;
			padding: 0.65rem 0.75rem;
		}
		.ward-head {
			display: flex;
			justify-content: space-between;
			align-items: center;
			margin-bottom: 0.35rem;
		}
		.ward-head strong { font-size: 0.85rem; color: #0f172a; }
		.ward-type-badge {
			font-size: 0.68rem;
			background: #f1f5f9;
			color: #475569;
			border-radius: 6px;
			padding: 0.1rem 0.4rem;
			border: 1px solid #e2e8f0;
		}
		.ward-metrics {
			display: flex;
			justify-content: space-between;
			align-items: baseline;
			font-size: 0.78rem;
			color: #475569;
			margin-bottom: 0.4rem;
		}
		.occupancy-pct { font-weight: 700; font-size: 0.82rem; }
		.occupancy-pct.low  { color: #16a34a; }
		.occupancy-pct.med  { color: #d97706; }
		.occupancy-pct.high { color: #dc2626; }

		.progress-track { height: 6px; background: #e2e8f0; border-radius: 999px; overflow: hidden; }
		.progress-fill { height: 6px; border-radius: 999px; transition: width 0.4s ease; }
		.progress-fill.low  { background: linear-gradient(90deg, #4ade80, #16a34a); }
		.progress-fill.med  { background: linear-gradient(90deg, #fcd34d, #d97706); }
		.progress-fill.high { background: linear-gradient(90deg, #f87171, #dc2626); }

		/* Tables */
		.table-wrap { overflow-x: auto; }
		table { width: 100%; border-collapse: collapse; font-size: 0.8rem; }
		th {
			text-align: left;
			padding: 0.45rem 0.6rem;
			border-bottom: 2px solid #f1f5f9;
			color: #64748b;
			font-size: 0.72rem;
			font-weight: 700;
			text-transform: uppercase;
			letter-spacing: 0.04em;
			white-space: nowrap;
		}
		td { padding: 0.5rem 0.6rem; border-bottom: 1px solid #f1f5f9; color: #334155; white-space: nowrap; }
		tr:last-child td { border-bottom: none; }
		tr:hover td { background: #f8fafc; }

		.bed-num { font-weight: 700; color: #0f172a; }
		.ward-sub { display: block; font-size: 0.72rem; color: #94a3b8; margin-top: 0.15rem; }
		.encounter-id { font-family: monospace; font-size: 0.78rem; color: #475569; }
		.date-cell { color: #64748b; font-size: 0.77rem; }

		/* Status pills */
		.status-pill {
			display: inline-block;
			border-radius: 999px;
			padding: 0.18rem 0.55rem;
			font-size: 0.68rem;
			font-weight: 700;
		}
		.status-available   { background: #dcfce7; color: #166534; }
		.status-occupied    { background: #fee2e2; color: #991b1b; }
		.status-maintenance { background: #f1f5f9; color: #334155; }
		.asg-allocated { background: #dbeafe; color: #1e40af; }
		.asg-admitted  { background: #dcfce7; color: #166534; }

		/* Responsive */
		@media (max-width: 1200px) {
			.workspace-grid {
				grid-template-columns: 1fr;
				grid-template-areas: 'queue' 'occupancy' 'beds' 'assign';
			}
		}
	`],
})
export class BedManagementWorkspaceComponent implements OnInit, OnDestroy {
	queue: BedAllocationRequestItem[] = [];
	wards: WardItem[] = [];
	beds: BedItem[] = [];
	assignments: BedAssignmentItem[] = [];

	loading = false;
	errorMessage = '';

	/** Tracks which request has the allocation panel open */
	openAllocationRequestId: number | null = null;

	/** Per-request loading state for assignable beds */
	loadingBeds: Record<number, boolean> = {};

	private assignableByRequest: Record<number, BedItem[]> = {};
	private destroy$ = new Subject<void>();

	constructor(
		private readonly bedManagementService: BedManagementService,
		private readonly cdr: ChangeDetectorRef,
	) {}

	ngOnInit(): void {
		this.loadDashboard();
	}

	ngOnDestroy(): void {
		this.destroy$.next();
		this.destroy$.complete();
	}

	// ── Data loading ────────────────────────────────────────────────────────────

	loadDashboard(): void {
		this.loading = true;
		this.errorMessage = '';
		this.openAllocationRequestId = null;
		this.assignableByRequest = {};

		forkJoin({
			queue:       this.bedManagementService.getPriorityQueue(),
			wards:       this.bedManagementService.getWardOccupancy(),
			beds:        this.bedManagementService.getBeds('AVAILABLE'),
			assignments: this.bedManagementService.getAssignmentsByStatus('ACTIVE'),
		})
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: ({ queue, wards, beds, assignments }) => {
					this.queue       = queue;
					this.wards       = wards;
					this.beds        = beds;
					this.assignments = assignments;
					this.loading     = false;
					this.cdr.markForCheck();
				},
				error: (err) => {
					this.errorMessage = err?.error?.message || 'Failed to load workspace data. Please retry.';
					this.loading = false;
					this.cdr.markForCheck();
				},
			});
	}

	// ── Computed helpers ─────────────────────────────────────────────────────────

	get availableBedCount(): number {
		return this.beds.filter(b => b.status === 'AVAILABLE').length;
	}

	matchingBeds(req: BedAllocationRequestItem): BedItem[] {
		return this.assignableByRequest[req.id] ?? [];
	}

	isAllocationOpen(requestId: number): boolean {
		return this.openAllocationRequestId === requestId;
	}

	/** Returns a CSS class string based on occupancy percentage */
	occupancyClass(rate: number): string {
		if (rate >= 85) return 'high';
		if (rate >= 60) return 'med';
		return 'low';
	}

	// ── Queue actions ─────────────────────────────────────────────────────────────

	openAllocation(req: BedAllocationRequestItem): void {
		if (this.openAllocationRequestId === req.id) {
			this.openAllocationRequestId = null;
			return;
		}
		this.openAllocationRequestId = req.id;
		this.fetchAssignableBeds(req);
	}

	/** Fetches assignable beds for a request only if not already cached */
	private fetchAssignableBeds(req: BedAllocationRequestItem): void {
		if (this.assignableByRequest[req.id] !== undefined) {
			return;
		}

		this.loadingBeds = { ...this.loadingBeds, [req.id]: true };
		this.cdr.markForCheck();

		this.bedManagementService
			.getAssignableBeds(req.requiredBedType, req.preferredWardId ?? undefined)
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (beds) => {
					this.assignableByRequest[req.id] = beds;
					this.loadingBeds = { ...this.loadingBeds, [req.id]: false };
					this.cdr.markForCheck();
				},
				error: () => {
					this.assignableByRequest[req.id] = [];
					this.loadingBeds = { ...this.loadingBeds, [req.id]: false };
					this.cdr.markForCheck();
				},
			});
	}

	markUnderReview(req: BedAllocationRequestItem): void {
		this.executeAndRefresh(this.bedManagementService.markUnderReview(req.id));
	}

	allocateWithBed(req: BedAllocationRequestItem, bed: BedItem): void {
		this.openAllocationRequestId = null;
		this.executeAndRefresh(this.bedManagementService.allocateBed(req.id, bed.id));
	}

	reject(req: BedAllocationRequestItem): void {
		// Replace window.prompt with a proper dialog in production (e.g. p-dialog or p-confirmDialog)
		const reason = window.prompt('Enter rejection reason:');
		if (!reason?.trim()) {
			return;
		}
		this.executeAndRefresh(this.bedManagementService.rejectRequest(req.id, reason.trim()));
	}

	// ── Assignment actions ────────────────────────────────────────────────────────

	admit(assignment: BedAssignmentItem): void {
		this.executeAndRefresh(this.bedManagementService.admitPatient(assignment.id));
	}

	discharge(assignment: BedAssignmentItem): void {
		this.executeAndRefresh(this.bedManagementService.dischargePatient(assignment.id));
	}

	// ── Formatting ────────────────────────────────────────────────────────────────

	formatDateTime(dt: string): string {
		if (!dt) return '—';
		const d = new Date(dt);
		if (isNaN(d.getTime())) return '—';
		return (
			d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
			', ' +
			d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
		);
	}

	// ── Private helpers ───────────────────────────────────────────────────────────

	private executeAndRefresh(operation$: import('rxjs').Observable<unknown>): void {
		operation$.pipe(takeUntil(this.destroy$)).subscribe({
			next:  () => this.loadDashboard(),
			error: (err) => {
				this.errorMessage = err?.error?.message || 'Operation failed. Please try again.';
				this.cdr.markForCheck();
			},
		});
	}
}