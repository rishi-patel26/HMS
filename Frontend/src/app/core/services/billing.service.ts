import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Bill, BillItemRequest, PaymentRequest } from '../models/hms.model';

@Injectable({ providedIn: 'root' })
export class BillingService {
  private readonly apiUrl = `${environment.apiUrl}/bills`;

  constructor(private readonly http: HttpClient) {}

  createBill(encounterId: number): Observable<Bill> {
    return this.http.post<Bill>(`${this.apiUrl}/create/${encounterId}`, {});
  }

  addBillItem(billId: number, request: BillItemRequest): Observable<Bill> {
    return this.http.post<Bill>(`${this.apiUrl}/${billId}/items`, request);
  }

  getBill(billId: number): Observable<Bill> {
    return this.http.get<Bill>(`${this.apiUrl}/${billId}`);
  }

  payBill(billId: number, request: PaymentRequest): Observable<Bill> {
    return this.http.post<Bill>(`${this.apiUrl}/${billId}/pay`, request);
  }

  getBillByEncounter(encounterId: number): Observable<Bill> {
    return this.http.get<Bill>(`${this.apiUrl}/encounter/${encounterId}`);
  }

  getTodayBills(): Observable<Bill[]> {
    return this.http.get<Bill[]>(`${this.apiUrl}/today`);
  }

  getPendingBills(): Observable<Bill[]> {
    return this.http.get<Bill[]>(`${this.apiUrl}/pending`);
  }

  getAllBills(): Observable<Bill[]> {
    return this.http.get<Bill[]>(`${this.apiUrl}/all`);
  }

  getBillsByDate(date: string): Observable<Bill[]> {
    return this.http.get<Bill[]>(`${this.apiUrl}/by-date`, { params: { date } });
  }

  searchBills(params: { billNumber?: string; status?: string }): Observable<Bill[]> {
    let httpParams = new HttpParams();
    if (params.billNumber) httpParams = httpParams.set('billNumber', params.billNumber);
    if (params.status) httpParams = httpParams.set('status', params.status);
    return this.http.get<Bill[]>(`${this.apiUrl}/search`, { params: httpParams });
  }

  deleteBill(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
