import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  BedAllocationRequestItem,
  BedAssignmentItem,
  BedEventItem,
  BedItem,
  BedCalendarDay,
  BedManagerDashboard,
  BedType,
  CreateBedAllocationRequest,
  WardItem
} from '../models/hms.model';

@Injectable({ providedIn: 'root' })
export class BedManagementService {
  private readonly baseUrl = `${environment.apiUrl}/bed-management`;
  private readonly workflowUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  getWardOccupancy(): Observable<WardItem[]> {
    return this.http.get<WardItem[]>(`${this.workflowUrl}/wards`);
  }

  getBeds(status?: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE'): Observable<BedItem[]> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    return this.http.get<BedItem[]>(`${this.workflowUrl}/beds`, { params });
  }

  getAvailableBeds(bedType?: BedType, wardId?: number): Observable<BedItem[]> {
    let params = new HttpParams();
    if (bedType) params = params.set('bedType', bedType);
    if (wardId) params = params.set('wardId', wardId);
    return this.http.get<BedItem[]>(`${this.baseUrl}/beds/available`, { params });
  }

  getAssignableBeds(bedType: BedType, preferredWardId?: number, excludeBedId?: number): Observable<BedItem[]> {
    let params = new HttpParams().set('bedType', bedType);
    if (preferredWardId) params = params.set('preferredWardId', preferredWardId);
    if (excludeBedId) params = params.set('excludeBedId', excludeBedId);
    return this.http.get<BedItem[]>(`${this.baseUrl}/beds/assignable`, { params });
  }

  getAllBeds(): Observable<BedItem[]> {
    return this.http.get<BedItem[]>(`${this.baseUrl}/beds`);
  }

  getMonthlyCalendar(year: number, month: number): Observable<BedCalendarDay[]> {
    const params = new HttpParams()
      .set('year', year)
      .set('month', month);
    return this.http.get<BedCalendarDay[]>(`${this.baseUrl}/calendar`, { params });
  }

  createAllocationRequest(payload: CreateBedAllocationRequest): Observable<BedAllocationRequestItem> {
    return this.http.post<BedAllocationRequestItem>(`${this.baseUrl}/requests`, payload);
  }

  getMyRequests(): Observable<BedAllocationRequestItem[]> {
    return this.http.get<BedAllocationRequestItem[]>(`${this.baseUrl}/requests/my`);
  }

  getRequestsByEncounter(encounterId: number): Observable<BedAllocationRequestItem[]> {
    return this.http.get<BedAllocationRequestItem[]>(`${this.baseUrl}/requests/encounter/${encounterId}`);
  }

  getRequestTimeline(requestId: number): Observable<BedEventItem[]> {
    return this.http.get<BedEventItem[]>(`${this.baseUrl}/requests/${requestId}/timeline`);
  }

  getPriorityQueue(): Observable<BedAllocationRequestItem[]> {
    return this.http.get<BedAllocationRequestItem[]>(`${this.baseUrl}/queue`);
  }

  getRequestsByStatus(status?: 'REQUESTED' | 'UNDER_REVIEW' | 'ALLOCATED' | 'REJECTED'): Observable<BedAllocationRequestItem[]> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    return this.http.get<BedAllocationRequestItem[]>(`${this.workflowUrl}/bed-requests`, { params });
  }

  markUnderReview(requestId: number, notes?: string): Observable<BedAllocationRequestItem> {
    return this.http.put<BedAllocationRequestItem>(`${this.baseUrl}/requests/${requestId}/review`, { notes });
  }

  rejectRequest(requestId: number, notes: string): Observable<BedAllocationRequestItem> {
    return this.http.put<BedAllocationRequestItem>(`${this.baseUrl}/requests/${requestId}/reject`, { notes });
  }

  allocateBed(requestId: number, bedId: number, notes?: string): Observable<BedAssignmentItem> {
    return this.http.put<BedAssignmentItem>(`${this.baseUrl}/requests/${requestId}/allocate`, { bedId, notes });
  }

  getActiveAssignments(): Observable<BedAssignmentItem[]> {
    return this.http.get<BedAssignmentItem[]>(`${this.baseUrl}/assignments/active`);
  }

  getAssignmentsByStatus(status?: string): Observable<BedAssignmentItem[]> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    return this.http.get<BedAssignmentItem[]>(`${this.workflowUrl}/bed-assignments`, { params });
  }

  admitPatient(assignmentId: number): Observable<BedAssignmentItem> {
    return this.http.put<BedAssignmentItem>(`${this.baseUrl}/assignments/${assignmentId}/admit`, {});
  }

  dischargePatient(assignmentId: number): Observable<BedAssignmentItem> {
    return this.http.put<BedAssignmentItem>(`${this.baseUrl}/assignments/${assignmentId}/discharge`, {});
  }

  transferBed(assignmentId: number, newBedId: number, notes?: string): Observable<BedAssignmentItem> {
    return this.http.put<BedAssignmentItem>(`${this.baseUrl}/assignments/${assignmentId}/transfer`, { newBedId, notes });
  }

  getDashboard(): Observable<BedManagerDashboard> {
    return this.http.get<BedManagerDashboard>(`${this.baseUrl}/dashboard`);
  }
}
