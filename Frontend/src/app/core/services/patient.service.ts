import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Patient, PatientRequest } from '../models/hms.model';

@Injectable({ providedIn: 'root' })
export class PatientService {
  private readonly apiUrl = `${environment.apiUrl}/patients`;

  constructor(private readonly http: HttpClient) {}

  createPatient(request: PatientRequest): Observable<Patient> {
    return this.http.post<Patient>(this.apiUrl, request);
  }

  getPatientById(id: number): Observable<Patient> {
    return this.http.get<Patient>(`${this.apiUrl}/${id}`);
  }

  searchPatients(query: string): Observable<Patient[]> {
    const params = new HttpParams().set('query', query);
    return this.http.get<Patient[]>(`${this.apiUrl}/search`, { params });
  }

  getRecentPatients(): Observable<Patient[]> {
    return this.http.get<Patient[]>(`${this.apiUrl}/recent`);
  }

  updatePatient(id: number, request: PatientRequest): Observable<Patient> {
    return this.http.put<Patient>(`${this.apiUrl}/${id}`, request);
  }

  deletePatient(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
