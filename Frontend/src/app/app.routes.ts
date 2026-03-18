import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { LoginComponent } from './features/authentication/login/login.component';
import { AdminDashboardComponent } from './features/dashboards/admin/admin-dashboard.component';
import { FrontdeskDashboardComponent } from './features/dashboards/frontdesk/frontdesk-dashboard.component';
import { DoctorDashboardComponent } from './features/dashboards/doctor/doctor-dashboard.component';
import { MainLayoutComponent } from './layout/components/main-layout/main-layout.component';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { roleGuard } from './core/guards/role.guard';
import { Role } from './core/enums/role.enum';
import { AuthService } from './core/services/auth.service';

// Patient components
import { PatientListComponent } from './features/patients/patient-list/patient-list.component';
import { PatientFormComponent } from './features/patients/patient-form/patient-form.component';
import { PatientProfileComponent } from './features/patients/patient-profile/patient-profile.component';

// Appointment components
import { AppointmentListComponent } from './features/appointments/appointment-list/appointment-list.component';
import { AppointmentFormComponent } from './features/appointments/appointment-form/appointment-form.component';

// Encounter components
import { EncounterQueueComponent } from './features/encounters/encounter-queue/encounter-queue.component';
import { EncounterDetailsComponent } from './features/encounters/encounter-details/encounter-details.component';

// Billing components
import { BillListComponent } from './features/billing/bill-list/bill-list.component';
import { CreateBillComponent } from './features/billing/create-bill/create-bill.component';
import { BillDetailsComponent } from './features/billing/bill-details/bill-details.component';

// Episode components
import { EpisodeListComponent } from './features/episodes/episode-list.component';

// Consultation components
import { ConsultationComponent } from './features/consultation/consultation.component';

// Service Catalog components
import { ServiceCatalogComponent } from './features/service-catalog/service-catalog.component';

// User Management components
import { UserManagementComponent } from './features/users/user-management.component';

// Nurse components
import { DoctorPatientsComponent } from './features/nurse/doctor-patients/doctor-patients.component';
import { PatientCaseComponent } from './features/nurse/patient-case/patient-case.component';
import { BedRequestComponent } from './features/nurse/bed-request/bed-request.component';
import { NurseDashboardComponent } from '@features/dashboards/nurse-dashboard/nurse-dashboard.component';
import { BedManagerDashboardComponent } from '@features/dashboards/bed-manager/bed-manager-dashboard.component';
import { BedManagementWorkspaceComponent } from '@features/dashboards/bed-manager/bed-management-workspace.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },

  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        canActivate: [() => {
          const authService = inject(AuthService);
          const router = inject(Router);
          router.navigate([authService.getDashboardRoute()]);
          return false;
        }],
        component: FrontdeskDashboardComponent
      },
      {
        path: 'dashboard',
        component: AdminDashboardComponent,
        canActivate: [adminGuard]
      },
      {
        path: 'frontdesk-dashboard',
        component: FrontdeskDashboardComponent,
        canActivate: [roleGuard([Role.FRONTDESK, Role.ADMIN])]
      },
      {
        path: 'doctor-dashboard',
        component: DoctorDashboardComponent,
        canActivate: [roleGuard([Role.DOCTOR, Role.ADMIN])]
      },
      {
        path: 'bed-manager-dashboard',
        component: BedManagerDashboardComponent,
        canActivate: [roleGuard([Role.BED_MANAGER, Role.ADMIN])]
      },
      {
        path:'bed-manager/management',
        component: BedManagementWorkspaceComponent,
        canActivate: [roleGuard([Role.BED_MANAGER, Role.ADMIN])]
      },

      // Patient routes
      { path: 'patients', component: PatientListComponent },
      {
        path: 'patients/new',
        component: PatientFormComponent,
        canActivate: [roleGuard([Role.FRONTDESK, Role.ADMIN])]
      },
      { path: 'patients/:id', component: PatientProfileComponent },

      // Appointment routes
      { path: 'appointments', component: AppointmentListComponent },
      {
        path: 'appointments/new',
        component: AppointmentFormComponent,
        canActivate: [roleGuard([Role.FRONTDESK, Role.ADMIN])]
      },

      // Encounter routes
      { path: 'encounters', component: EncounterQueueComponent },
      {
        path: 'encounters/checkin',
        component: EncounterDetailsComponent,
        canActivate: [roleGuard([Role.FRONTDESK, Role.ADMIN])]
      },
      { path: 'encounters/:id', component: EncounterDetailsComponent },

      // Billing routes (FrontDesk and Admin only - Doctor has no billing access)
      {
        path: 'billing',
        component: BillListComponent,
        canActivate: [roleGuard([Role.FRONTDESK, Role.ADMIN])]
      },
      {
        path: 'billing/create',
        component: CreateBillComponent,
        canActivate: [roleGuard([Role.FRONTDESK, Role.ADMIN])]
      },
      {
        path: 'billing/:id',
        component: BillDetailsComponent,
        canActivate: [roleGuard([Role.FRONTDESK, Role.ADMIN])]
      },

      // Episode routes
      { path: 'episodes', component: EpisodeListComponent },

      // Consultation routes
      { path: 'consultation', component: ConsultationComponent },
      { path: 'consultation/:encounterId', component: ConsultationComponent },

      // Service Catalog routes (Admin only)
      {
        path: 'service-catalog',
        component: ServiceCatalogComponent,
        canActivate: [adminGuard]
      },

      // User Management routes (Admin only)
      {
        path: 'users',
        component: UserManagementComponent,
        canActivate: [adminGuard]
      },

      // Nurse routes
      {
        path: 'nurse-dashboard',
        component: NurseDashboardComponent,
        canActivate: [roleGuard([Role.NURSE, Role.ADMIN])]
      },
      {
        path: 'nurse/doctor-patients',
        component: DoctorPatientsComponent,
        canActivate: [roleGuard([Role.NURSE, Role.ADMIN])]
      },
      {
        path: 'nurse/case/:encounterId',
        component: PatientCaseComponent,
        canActivate: [roleGuard([Role.NURSE, Role.ADMIN])]
      },
      {
        path: 'nurse/bed-management',
        component: BedRequestComponent,
        canActivate: [roleGuard([Role.NURSE, Role.ADMIN])]
      },
      {
        path: 'nurse/bed-requests',
        redirectTo: 'nurse/bed-management',
        pathMatch: 'full'
      },
    ]
  },

  { path: '**', redirectTo: 'login' }
];
