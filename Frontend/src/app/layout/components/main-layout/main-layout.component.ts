import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { Role } from '../../../core/enums/role.enum';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  roles: Role[];
}

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss'
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  userRole: Role | null = null;
  username = '';
  roleLabel = '';
  sidebarCollapsed = false;
  filteredNavItems: NavItem[] = [];

  private readonly allNavItems: NavItem[] = [
    { label: 'Dashboard',       icon: 'pi pi-th-large',   route: '/dashboard',              roles: [Role.ADMIN] },
    { label: 'Dashboard',       icon: 'pi pi-th-large',   route: '/frontdesk-dashboard',    roles: [Role.FRONTDESK] },
    { label: 'Dashboard',       icon: 'pi pi-th-large',   route: '/doctor-dashboard',       roles: [Role.DOCTOR] },
    { label: 'Dashboard',       icon: 'pi pi-th-large',   route: '/nurse-dashboard',        roles: [Role.NURSE] },
    { label: 'Dashboard',       icon: 'pi pi-th-large',   route: '/bed-manager-dashboard',  roles: [Role.BED_MANAGER] },
    { label: 'Doctor Patients', icon: 'pi pi-users',      route: '/nurse/doctor-patients',  roles: [Role.NURSE, Role.ADMIN] },
    { label: 'Bed Management',  icon: 'pi pi-building',   route: '/nurse/bed-management',   roles: [Role.NURSE] },
    { label: 'Bed Management',  icon: 'pi pi-building',   route: '/bed-manager/management', roles: [Role.BED_MANAGER, Role.ADMIN] },
    { label: 'Patients',        icon: 'pi pi-users',      route: '/patients',               roles: [Role.FRONTDESK, Role.ADMIN, Role.DOCTOR, Role.NURSE] },
    { label: 'Appointments',    icon: 'pi pi-calendar',   route: '/appointments',           roles: [Role.FRONTDESK, Role.ADMIN, Role.DOCTOR, Role.NURSE] },
    { label: 'Encounter Queue', icon: 'pi pi-list',       route: '/encounters',             roles: [Role.FRONTDESK, Role.ADMIN, Role.NURSE] },
    { label: 'Consultation',    icon: 'pi pi-file-edit',  route: '/consultation',           roles: [Role.DOCTOR, Role.ADMIN] },
    { label: 'Billing',         icon: 'pi pi-money-bill', route: '/billing',                roles: [Role.FRONTDESK, Role.ADMIN] },
    { label: 'Episodes',        icon: 'pi pi-bookmark',   route: '/episodes',               roles: [Role.ADMIN, Role.DOCTOR] },
    { label: 'Service Catalog', icon: 'pi pi-box',        route: '/service-catalog',        roles: [Role.ADMIN] },
    { label: 'Users',           icon: 'pi pi-user-edit',  route: '/users',                  roles: [Role.ADMIN] },
  ];

  private authSub!: Subscription;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.authSub = this.authService.authReady$.pipe(filter(ready => ready)).subscribe(() => {
      this.loadUserState();
    });
    if (this.authService.isLoggedIn()) this.loadUserState();
  }

  ngOnDestroy(): void {
    this.authSub?.unsubscribe();
  }

  private loadUserState(): void {
    this.userRole = this.authService.getUserRole();
    this.username = this.authService.getUsername();
    this.roleLabel = this.getRoleLabel(this.userRole);
    this.filteredNavItems = this.allNavItems.filter(
      item => this.userRole && item.roles.includes(this.userRole)
    );
  }

  private getRoleLabel(role: Role | null): string {
    switch (role) {
      case Role.ADMIN:       return 'Administrator';
      case Role.FRONTDESK:   return 'Front Desk';
      case Role.DOCTOR:      return 'Doctor';
      case Role.NURSE:       return 'Nurse';
      case Role.BED_MANAGER: return 'Bed Manager';
      default:               return '';
    }
  }

  toggleSidebar(): void { this.sidebarCollapsed = !this.sidebarCollapsed; }
  logout(): void { this.authService.logout(); }
}
