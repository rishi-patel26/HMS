import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ServiceCatalogItem, ServiceCatalogRequest } from '../models/hms.model';

@Injectable({ providedIn: 'root' })
export class ServiceCatalogService {
  private readonly apiUrl = `${environment.apiUrl}/services`;

  constructor(private readonly http: HttpClient) {}

  getAllServices(): Observable<ServiceCatalogItem[]> {
    return this.http.get<ServiceCatalogItem[]>(this.apiUrl);
  }

  createService(request: ServiceCatalogRequest): Observable<ServiceCatalogItem> {
    return this.http.post<ServiceCatalogItem>(this.apiUrl, request);
  }

  updateService(id: number, request: ServiceCatalogRequest): Observable<ServiceCatalogItem> {
    return this.http.put<ServiceCatalogItem>(`${this.apiUrl}/${id}`, request);
  }

  disableService(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  searchServices(query: string): Observable<ServiceCatalogItem[]> {
    return this.http.get<ServiceCatalogItem[]>(`${this.apiUrl}/search`, {
      params: { query }
    });
  }
}
