import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import {
  UserService,
  UserResponse,
  UserCreateRequest,
  UserUpdateRequest
} from '../../core/services/user.service';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ToastModule, DatePipe],
  providers: [MessageService],
  templateUrl: './user-management.component.html',
  styleUrl: './user-management.component.scss'
})
export class UserManagementComponent implements OnInit {
  users: UserResponse[] = [];
  allUsers: UserResponse[] = [];
  userForm!: FormGroup;
  showForm = false;
  editingId: number | null = null;
  saving = false;
  loading = true;
  searchQuery = '';

  roles = [
    { value: 'ADMIN', label: 'Admin' },
    { value: 'DOCTOR', label: 'Doctor' },
    { value: 'FRONTDESK', label: 'Front Desk' },
    { value: 'NURSE', label: 'Nurse' },
    { value: 'BED_MANAGER', label: 'Bed Manager' }
  ];

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadUsers();
  }

  private initForm(): void {
    this.userForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: ['', Validators.required]
    });
  }

  loadUsers(): void {
    this.loading = true;
    this.userService.getAllUsers().subscribe({
      next: (users) => {
        this.allUsers = users;
        this.users = users;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load users'
        });
        this.cdr.detectChanges();
      }
    });
  }

  searchUsers(): void {
    if (!this.searchQuery.trim()) {
      this.users = this.allUsers;
      this.cdr.detectChanges();
      return;
    }

    this.loading = true;
    this.userService.searchUsers(this.searchQuery).subscribe({
      next: (users) => {
        this.users = users;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to search users'
        });
        this.cdr.detectChanges();
      }
    });
  }

  onSearchInput(): void {
    this.searchUsers();
  }

  toggleForm(): void {
    this.showForm = !this.showForm;
    if (!this.showForm) {
      this.cancelEdit();
    }
  }

  saveUser(): void {
    if (this.editingId) {
      this.updateUser();
    } else {
      this.createUser();
    }
  }

  private createUser(): void {
    if (this.userForm.invalid) return;
    this.saving = true;

    const request: UserCreateRequest = {
      username: this.userForm.value.username,
      email: this.userForm.value.email,
      password: this.userForm.value.password,
      role: this.userForm.value.role
    };

    this.userService.createUser(request).subscribe({
      next: () => {
        this.saving = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'User created successfully'
        });
        this.cancelEdit();
        this.showForm = false;
        this.loadUsers();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.saving = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.message || 'Failed to create user'
        });
        this.cdr.detectChanges();
      }
    });
  }

  private updateUser(): void {
    if (!this.editingId) return;
    this.saving = true;

    const update: UserUpdateRequest = {};
    if (this.userForm.value.email) update.email = this.userForm.value.email;
    if (this.userForm.value.role) update.role = this.userForm.value.role;
    if (this.userForm.value.password) update.password = this.userForm.value.password;

    this.userService.updateUser(this.editingId, update).subscribe({
      next: () => {
        this.saving = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'User updated successfully'
        });
        this.cancelEdit();
        this.showForm = false;
        this.loadUsers();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.saving = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.message || 'Failed to update user'
        });
        this.cdr.detectChanges();
      }
    });
  }

  editUser(user: UserResponse): void {
    this.editingId = user.id;
    this.showForm = true;
    this.userForm.patchValue({
      username: user.username,
      email: user.email,
      password: '',
      role: user.role
    });
    this.userForm.get('password')?.clearValidators();
    this.userForm.get('password')?.setValidators([Validators.minLength(6)]);
    this.userForm.get('password')?.updateValueAndValidity();
  }

  cancelEdit(): void {
    this.editingId = null;
    this.userForm.reset();
    this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
    this.userForm.get('password')?.updateValueAndValidity();
  }

  disableUser(user: UserResponse): void {
    if (!user.id) return;
    this.userService.deleteUser(user.id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: `User "${user.username}" has been disabled`
        });
        this.loadUsers();
        this.cdr.detectChanges();
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to disable user'
        });
        this.cdr.detectChanges();
      }
    });
  }

  enableUser(user: UserResponse): void {
    if (!user.id) return;
    this.userService.updateUser(user.id, { enabled: true }).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: `User "${user.username}" has been enabled`
        });
        this.loadUsers();
        this.cdr.detectChanges();
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to enable user'
        });
        this.cdr.detectChanges();
      }
    });
  }

  formatRole(role: string): string {
    const found = this.roles.find(r => r.value === role);
    return found ? found.label : role;
  }

  get activeCount(): number {
    return this.users.filter(u => u.enabled).length;
  }

  get disabledCount(): number {
    return this.users.filter(u => !u.enabled).length;
  }
}
