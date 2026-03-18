import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  DoctorOption, DoctorPatientItem, PatientCaseTimeline,
  NurseDashboardStats
} from '../models/hms.model';

@Injectable({ providedIn: 'root' })
export class NurseService {
  private readonly nurseUrl = `${environment.apiUrl}/nurse`;

  constructor(private readonly http: HttpClient) {}

  getDoctors(): Observable<DoctorOption[]> {
    return this.http.get<DoctorOption[]>(`${this.nurseUrl}/doctors`);
  }

  getDoctorPatients(doctorId: number): Observable<DoctorPatientItem[]> {
    return this.http.get<DoctorPatientItem[]>(`${this.nurseUrl}/doctor/${doctorId}/patients`);
  }

  getPatientCase(encounterId: number): Observable<PatientCaseTimeline> {
    return this.http.get<PatientCaseTimeline>(`${this.nurseUrl}/case/${encounterId}`);
  }

  getDashboardStats(): Observable<NurseDashboardStats> {
    return this.http.get<NurseDashboardStats>(`${this.nurseUrl}/dashboard-stats`);
  }
}
