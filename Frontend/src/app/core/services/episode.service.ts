import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Episode, EpisodeRequest } from '../models/hms.model';

@Injectable({ providedIn: 'root' })
export class EpisodeService {
  private readonly apiUrl = `${environment.apiUrl}/episodes`;

  constructor(private readonly http: HttpClient) {}

  createEpisode(request: EpisodeRequest): Observable<Episode> {
    return this.http.post<Episode>(this.apiUrl, request);
  }

  getEpisodes(filters?: { patientId?: number; status?: string }): Observable<Episode[]> {
    let params = new HttpParams();
    if (filters?.patientId) {
      params = params.set('patientId', filters.patientId.toString());
    }
    if (filters?.status) {
      params = params.set('status', filters.status);
    }
    return this.http.get<Episode[]>(this.apiUrl, { params });
  }

  getEpisodesByPatient(patientId: number): Observable<Episode[]> {
    return this.http.get<Episode[]>(`${this.apiUrl}/patient/${patientId}`);
  }

  getEpisodeById(id: number): Observable<Episode> {
    return this.http.get<Episode>(`${this.apiUrl}/${id}`);
  }

  closeEpisode(id: number): Observable<Episode> {
    return this.http.put<Episode>(`${this.apiUrl}/${id}/close`, {});
  }

  getDoctorEpisodes(): Observable<Episode[]> {
    return this.http.get<Episode[]>(`${this.apiUrl}/doctor`);
  }

  updateEpisode(id: number, request: EpisodeRequest): Observable<Episode> {
    return this.http.put<Episode>(`${this.apiUrl}/${id}`, request);
  }

  deleteEpisode(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
