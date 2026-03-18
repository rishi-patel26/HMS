import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ServiceCatalogService } from '@core/services/service-catalog.service';
import { ServiceCatalogItem, ServiceCatalogRequest } from '@core/models/hms.model';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-service-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ToastModule],
  providers: [MessageService],
  templateUrl: './service-catalog.component.html',
  styleUrls: ['./service-catalog.component.scss']
})
export class ServiceCatalogComponent implements OnInit {
  services: ServiceCatalogItem[] = [];
  serviceForm: FormGroup;
  showForm = false;
  editingId: number | null = null;
  saving = false;
  loading = true;
  filterCategory = '';
  filterStatus = '';

  constructor(
    private fb: FormBuilder,
    private serviceCatalogService: ServiceCatalogService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {
    this.serviceForm = this.fb.group({
      name: ['', Validators.required],
      price: [null, [Validators.required, Validators.min(0.01)]],
      description: [''],
      category: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadServices();
  }

  get activeCount(): number {
    return this.services.filter(s => s.active).length;
  }

  get categories(): string[] {
    const cats = new Set(this.services.map(s => s.category).filter(Boolean));
    return Array.from(cats).sort();
  }

  get categoryCount(): number {
    return this.categories.length;
  }

  get filteredServices(): ServiceCatalogItem[] {
    return this.services.filter(s => {
      if (this.filterCategory && s.category !== this.filterCategory) return false;
      if (this.filterStatus === 'active' && !s.active) return false;
      if (this.filterStatus === 'inactive' && s.active) return false;
      return true;
    });
  }

  loadServices(): void {
    this.loading = true;
    this.serviceCatalogService.getAllServices().subscribe({
      next: (services) => {
        this.services = services;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load services'
        });
        this.cdr.detectChanges();
      }
    });
  }

  toggleForm(): void {
    this.showForm = !this.showForm;
    if (!this.showForm) {
      this.cancelEdit();
    }
  }

  saveService(): void {
    if (this.serviceForm.invalid) {
      this.serviceForm.markAllAsTouched();
      return;
    }
    this.saving = true;

    const request: ServiceCatalogRequest = this.serviceForm.value;

    const obs = this.editingId
      ? this.serviceCatalogService.updateService(this.editingId, request)
      : this.serviceCatalogService.createService(request);

    obs.subscribe({
      next: () => {
        this.saving = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: this.editingId ? 'Service updated successfully' : 'Service created successfully'
        });
        this.cancelEdit();
        this.showForm = false;
        this.loadServices();
        this.cdr.detectChanges();
      },
      error: () => {
        this.saving = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to save service'
        });
        this.cdr.detectChanges();
      }
    });
  }

  editService(service: ServiceCatalogItem): void {
    this.editingId = service.id;
    this.showForm = true;
    this.serviceForm.patchValue({
      name: service.name,
      price: service.price,
      description: service.description,
      category: service.category
    });
  }

  cancelEdit(): void {
    this.editingId = null;
    this.showForm = false;
    this.serviceForm.reset();
  }

  toggleServiceStatus(service: ServiceCatalogItem): void {
    if (service.active) {
      this.serviceCatalogService.disableService(service.id).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: `${service.name} has been disabled`
          });
          this.loadServices();
          this.cdr.detectChanges();
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to disable service'
          });
          this.cdr.detectChanges();
        }
      });
    } else {
      const request: ServiceCatalogRequest = {
        name: service.name,
        price: service.price,
        description: service.description,
        category: service.category
      };
      this.serviceCatalogService.updateService(service.id, request).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: `${service.name} has been re-enabled`
          });
          this.loadServices();
          this.cdr.detectChanges();
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to enable service'
          });
          this.cdr.detectChanges();
        }
      });
    }
  }

  formatCategory(category: string): string {
    if (!category) return 'Uncategorized';
    switch (category) {
      case 'CONSULTATION': return 'Consultation';
      case 'LAB': return 'Lab';
      case 'RADIOLOGY': return 'Radiology';
      case 'PROCEDURE': return 'Procedure';
      case 'SURGERY': return 'Surgery';
      case 'PHARMACY': return 'Pharmacy';
      case 'ROOM': return 'Room & Board';
      default: return category;
    }
  }
}
