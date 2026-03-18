import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Consultation, ConsultationRequest } from '../models/hms.model';

@Injectable({ providedIn: 'root' })
export class ConsultationService {
  private readonly apiUrl = `${environment.apiUrl}/consultations`;

  constructor(private readonly http: HttpClient) {}

  createConsultation(request: ConsultationRequest): Observable<Consultation> {
    return this.http.post<Consultation>(this.apiUrl, request);
  }

  getConsultationById(id: number): Observable<Consultation> {
    return this.http.get<Consultation>(`${this.apiUrl}/${id}`);
  }

  getConsultationByEncounter(encounterId: number): Observable<Consultation> {
    return this.http.get<Consultation>(`${this.apiUrl}/encounter/${encounterId}`);
  }

  updateConsultation(id: number, request: ConsultationRequest): Observable<Consultation> {
    return this.http.put<Consultation>(`${this.apiUrl}/${id}`, request);
  }

  completeConsultation(id: number): Observable<Consultation> {
    return this.http.put<Consultation>(`${this.apiUrl}/${id}/complete`, {});
  }

  getConsultationsByDoctor(doctorUsername: string): Observable<Consultation[]> {
    return this.http.get<Consultation[]>(`${this.apiUrl}/doctor/${doctorUsername}`);
  }

  searchConsultations(params: { patientName?: string; patientId?: number }): Observable<Consultation[]> {
    let httpParams = new HttpParams();
    if (params.patientName) httpParams = httpParams.set('patientName', params.patientName);
    if (params.patientId) httpParams = httpParams.set('patientId', params.patientId.toString());
    return this.http.get<Consultation[]>(`${this.apiUrl}/search`, { params: httpParams });
  }

  getTodayConsultations(): Observable<Consultation[]> {
    return this.http.get<Consultation[]>(`${this.apiUrl}/today`);
  }
}
