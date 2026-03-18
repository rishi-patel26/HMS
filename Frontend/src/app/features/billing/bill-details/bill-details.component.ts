import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BillingService } from '../../../core/services/billing.service';
import { ServiceCatalogService } from '../../../core/services/service-catalog.service';
import { DataRefreshService } from '../../../core/services/data-refresh.service';
import { Bill, ServiceCatalogItem } from '../../../core/models/hms.model';

@Component({
  selector: 'app-bill-details',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bill-details.component.html',
  styleUrl: './bill-details.component.scss'
})
export class BillDetailsComponent implements OnInit {
  bill: Bill | null = null;
  services: ServiceCatalogItem[] = [];
  loading = true;

  selectedServiceId: number | null = null;
  itemQuantity = 1;
  addingItem = false;

  paymentAmount = 0;
  paymentMethod = 'CASH';
  processingPayment = false;

  errorMessage = '';

  constructor(
    private billingService: BillingService,
    private serviceCatalogService: ServiceCatalogService,
    private dataRefresh: DataRefreshService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const billId = Number(this.route.snapshot.paramMap.get('id'));
    if (billId) {
      this.loadBill(billId);
      this.loadServices();
    }
  }

  loadBill(billId: number): void {
    this.loading = true;
    this.billingService.getBill(billId).subscribe({
      next: (bill: Bill) => {
        this.bill = bill;
        this.loading = false;
        this.paymentAmount = bill.totalAmount - bill.paidAmount;
        this.cdr.detectChanges();
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  loadServices(): void {
    this.serviceCatalogService.getAllServices().subscribe({
      next: (data: ServiceCatalogItem[]) => { this.services = data.filter((s: ServiceCatalogItem) => s.active); this.cdr.detectChanges(); }
    });
  }

  getSelectedServicePrice(): number {
    if (!this.selectedServiceId) return 0;
    const svc = this.services.find((s: ServiceCatalogItem) => s.id === this.selectedServiceId);
    return svc ? svc.price : 0;
  }

  getItemSubtotal(): number {
    return this.getSelectedServicePrice() * this.itemQuantity;
  }

  addItem(): void {
    if (!this.bill || !this.selectedServiceId || this.itemQuantity < 1) return;

    this.addingItem = true;
    this.errorMessage = '';

    this.billingService.addBillItem(this.bill.id, {
      serviceId: this.selectedServiceId,
      quantity: this.itemQuantity
    }).subscribe({
      next: (updatedBill: Bill) => {
        this.bill = updatedBill;
        this.paymentAmount = updatedBill.totalAmount - updatedBill.paidAmount;
        this.selectedServiceId = null;
        this.itemQuantity = 1;
        this.addingItem = false;
        this.dataRefresh.triggerRefresh('billing');
        this.dataRefresh.triggerRefresh('dashboard');
        this.cdr.detectChanges();
      },
      error: (err: { error?: { message?: string } }) => {
        this.addingItem = false;
        this.errorMessage = err.error?.message || 'Failed to add item';
        this.cdr.detectChanges();
      }
    });
  }

  processPayment(): void {
    if (!this.bill || this.paymentAmount <= 0) return;

    this.processingPayment = true;
    this.errorMessage = '';

    this.billingService.payBill(this.bill.id, {
      amount: this.paymentAmount,
      paymentMethod: this.paymentMethod
    }).subscribe({
      next: (updatedBill: Bill) => {
        this.bill = updatedBill;
        this.paymentAmount = updatedBill.totalAmount - updatedBill.paidAmount;
        this.processingPayment = false;
        this.dataRefresh.triggerRefresh('billing');
        this.dataRefresh.triggerRefresh('dashboard');
        this.cdr.detectChanges();
      },
      error: (err: { error?: { message?: string } }) => {
        this.processingPayment = false;
        this.errorMessage = err.error?.message || 'Payment failed';
        this.cdr.detectChanges();
      }
    });
  }

  get balanceDue(): number {
    if (!this.bill) return 0;
    return this.bill.totalAmount - this.bill.paidAmount;
  }

  goBack(): void {
    this.router.navigate(['/billing']);
  }
}
