import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { BillingService } from '../../../core/services/billing.service';
import { AuthService } from '../../../core/services/auth.service';
import { Role } from '../../../core/enums/role.enum';
import { Bill } from '../../../core/models/hms.model';

@Component({
  selector: 'app-bill-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastModule],
  providers: [MessageService],
  templateUrl: './bill-list.component.html',
  styleUrl: './bill-list.component.scss'
})
export class BillListComponent implements OnInit {
  bills: Bill[] = [];
  loading = false;
  errorMessage = '';
  searchBillNumber = '';
  filterStatus = '';
  selectedDate = '';
  viewMode: 'today' | 'all' | 'search' | 'date' = 'today';
  userRole: string | null = null;
  canCreateBill = false;

  constructor(
    private billingService: BillingService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.userRole = this.authService.getUserRole();
    this.canCreateBill = this.authService.hasAnyRole([Role.ADMIN, Role.FRONTDESK]);
    this.loadTodayBills();
  }

  loadTodayBills(): void {
    this.loading = true;
    this.viewMode = 'today';
    this.billingService.getTodayBills().subscribe({
      next: (data) => { this.bills = data; this.loading = false; this.cdr.detectChanges(); },
      error: () => { this.loading = false; this.errorMessage = 'Failed to load bills'; this.cdr.detectChanges(); }
    });
  }

  loadAllBills(): void {
    this.loading = true;
    this.viewMode = 'all';
    this.billingService.getAllBills().subscribe({
      next: (data) => { this.bills = data; this.loading = false; this.cdr.detectChanges(); },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  onDateChange(date: string): void {
    if (!date) return;
    this.loading = true;
    this.viewMode = 'date';
    this.billingService.getBillsByDate(date).subscribe({
      next: (data) => { this.bills = data; this.loading = false; this.cdr.detectChanges(); },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  searchBills(): void {
    this.loading = true;
    this.viewMode = 'search';
    this.billingService.searchBills({ billNumber: this.searchBillNumber, status: this.filterStatus }).subscribe({
      next: (data) => { this.bills = data; this.loading = false; this.cdr.detectChanges(); },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  viewBillDetails(billId: number): void {
    this.router.navigate(['/billing', billId]);
  }

  createNewBill(): void {
    this.router.navigate(['/billing/create']);
  }

  deleteBill(bill: Bill): void {
    if (!confirm(`Delete bill ${bill.billNumber}? This action cannot be undone.`)) return;
    this.billingService.deleteBill(bill.id).subscribe({
      next: () => {
        this.bills = this.bills.filter(b => b.id !== bill.id);
        this.messageService.add({ severity: 'success', summary: 'Deleted', detail: `Bill ${bill.billNumber} deleted` });
        this.cdr.detectChanges();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete bill' });
        this.cdr.detectChanges();
      }
    });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'PAID': return 'status-paid';
      case 'PARTIAL': return 'status-partial';
      case 'PENDING': return 'status-pending';
      default: return '';
    }
  }
}
