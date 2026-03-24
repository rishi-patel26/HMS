import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { 
  DashboardStats, 
  DailyTrendResponse, 
  RevenueTrendResponse,
  EncounterStatusDistribution,
  AppointmentCalendarEvent,
  DepartmentStats
} from '../models/hms.model';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly apiUrl = `${environment.apiUrl}/dashboard`;

  constructor(private readonly http: HttpClient) {}

  getAdminStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.apiUrl}/admin`);
  }

  getFrontdeskStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.apiUrl}/frontdesk`);
  }

  getDoctorStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.apiUrl}/doctor`);
  }

  getDailyTrends(from: string, to: string): Observable<DailyTrendResponse> {
    const params = new HttpParams().set('from', from).set('to', to);
    return this.http.get<DailyTrendResponse>(`${this.apiUrl}/admin/daily-trends`, { params });
  }

  getRevenueTrends(from: string, to: string): Observable<RevenueTrendResponse> {
    const params = new HttpParams().set('from', from).set('to', to);
    return this.http.get<RevenueTrendResponse>(`${this.apiUrl}/admin/revenue-trends`, { params });
  }
  
  getEncounterStatusDistribution(): Observable<EncounterStatusDistribution> {
    return this.http.get<EncounterStatusDistribution>(`${this.apiUrl}/encounter-status-distribution`);
  }
  
  getAppointmentCalendarEvents(from: string, to: string): Observable<AppointmentCalendarEvent[]> {
    const params = new HttpParams().set('from', from).set('to', to);
    return this.http.get<AppointmentCalendarEvent[]>(`${this.apiUrl}/appointment-calendar`, { params });
  }
  
  getDepartmentStats(): Observable<DepartmentStats> {
    return this.http.get<DepartmentStats>(`${this.apiUrl}/department-stats`);
  }

  getAllAppointments(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/appointments`);
  }
}
