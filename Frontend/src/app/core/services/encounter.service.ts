import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Encounter, EncounterRequest, EncounterStatus } from '../models/hms.model';

@Injectable({ providedIn: 'root' })
export class EncounterService {
  private readonly apiUrl = `${environment.apiUrl}/encounters`;

  constructor(private readonly http: HttpClient) {}

  checkInPatient(request: EncounterRequest): Observable<Encounter> {
    return this.http.post<Encounter>(`${this.apiUrl}/checkin`, request);
  }

  getEncounterById(id: number): Observable<Encounter> {
    return this.http.get<Encounter>(`${this.apiUrl}/${id}`);
  }

  getEncountersByPatient(patientId: number): Observable<Encounter[]> {
    return this.http.get<Encounter[]>(`${this.apiUrl}/patient/${patientId}`);
  }

  updateEncounterStatus(id: number, status: EncounterStatus): Observable<Encounter> {
    return this.http.put<Encounter>(`${this.apiUrl}/${id}/status`, null, {
      params: { status }
    });
  }

  linkEpisodeToEncounter(encounterId: number, episodeId: number): Observable<Encounter> {
    return this.http.put<Encounter>(`${this.apiUrl}/${encounterId}/link-episode/${episodeId}`, {});
  }

  getTodayEncounters(): Observable<Encounter[]> {
    return this.http.get<Encounter[]>(`${this.apiUrl}/today`);
  }

  getDoctorTodayEncounters(): Observable<Encounter[]> {
    return this.http.get<Encounter[]>(`${this.apiUrl}/doctor/today`);
  }

  getEncountersByDate(date: string): Observable<Encounter[]> {
    return this.http.get<Encounter[]>(`${this.apiUrl}/by-date`, {
      params: { date }
    });
  }

  getDoctorAllEncounters(): Observable<Encounter[]> {
    return this.http.get<Encounter[]>(`${this.apiUrl}/doctor/all`);
  }

  getDoctorEncountersByDate(date: string): Observable<Encounter[]> {
    return this.http.get<Encounter[]>(`${this.apiUrl}/doctor/by-date`, {
      params: { date }
    });
  }

  getEncountersByEpisode(episodeId: number): Observable<Encounter[]> {
    return this.http.get<Encounter[]>(`${this.apiUrl}/episode/${episodeId}`);
  }
}
