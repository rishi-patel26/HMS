import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DashboardStats, DailyTrendResponse, RevenueTrendResponse } from '../models/hms.model';

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
}
