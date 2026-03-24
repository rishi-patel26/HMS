import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { type Notification } from '../models/hms.model';
import { environment } from '../../../environments/environment';
import { Client, IMessage } from '@stomp/stompjs';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly apiUrl = `${environment.apiUrl}/notifications`;
  private readonly wsUrl = `${environment.apiUrl}/ws`;
  
  private stompClient: Client | null = null;
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  private unreadCountSubject = new BehaviorSubject<number>(0);
  
  public notifications$ = this.notificationsSubject.asObservable();
  public unreadCount$ = this.unreadCountSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    // Initialize WebSocket connection when auth is ready
    this.authService.isAuthenticated$.subscribe(isAuth => {
      if (isAuth) {
        this.connect();
        this.loadInitialNotifications();
      } else {
        this.disconnect();
      }
    });
  }

  private connect(): void {
    const token = this.readCookie('accessToken');
    if (!token) return;

    // Use native WebSocket instead of SockJS to avoid polling
    const wsUrl = this.wsUrl.replace('/api', '').replace('http', 'ws');

    this.stompClient = new Client({
      brokerURL: `${wsUrl}/ws`,
      connectHeaders: {
        Authorization: `Bearer ${token}`
      },
      debug: (str) => {
        console.log('STOMP: ' + str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    this.stompClient.onConnect = () => {
      console.log('WebSocket connected');
      this.subscribeToNotifications();
    };

    this.stompClient.onStompError = (frame) => {
      console.error('STOMP error:', frame);
    };

    this.stompClient.activate();
  }

  private subscribeToNotifications(): void {
    if (!this.stompClient) return;

    const username = this.authService.getUsername();
    const role = this.authService.getUserRole();

    // Subscribe to user-specific notifications
    this.stompClient.subscribe(`/user/queue/notifications`, (message: IMessage) => {
      this.handleIncomingNotification(message);
    });

    // Subscribe to role-based notifications
    if (role) {
      this.stompClient.subscribe(`/topic/notifications/${role}`, (message: IMessage) => {
        this.handleIncomingNotification(message);
      });
    }
  }

  private handleIncomingNotification(message: IMessage): void {
    const notification: Notification = JSON.parse(message.body);
    const current = this.notificationsSubject.value;
    this.notificationsSubject.next([notification, ...current]);
    this.unreadCountSubject.next(this.unreadCountSubject.value + 1);
    
    // Show browser notification if permitted
    this.showBrowserNotification(notification);
  }

  private showBrowserNotification(notification: Notification): void {
    if ('Notification' in window && window.Notification.permission === 'granted') {
      new window.Notification('HMS Notification', {
        body: notification.message,
        icon: '/favicon.ico'
      });
    }
  }

  private loadInitialNotifications(): void {
    this.getMyNotifications().subscribe(notifications => {
      this.notificationsSubject.next(notifications);
    });
    
    this.getUnreadCount().subscribe(result => {
      this.unreadCountSubject.next(result.count);
    });
  }

  private disconnect(): void {
    if (this.stompClient) {
      this.stompClient.deactivate();
      this.stompClient = null;
    }
    this.notificationsSubject.next([]);
    this.unreadCountSubject.next(0);
  }

  private readCookie(name: string): string | null {
    const prefix = `${name}=`;
    for (let cookie of document.cookie.split(';')) {
      cookie = cookie.trim();
      if (cookie.startsWith(prefix)) return cookie.substring(prefix.length);
    }
    return null;
  }

  requestNotificationPermission(): void {
    if ('Notification' in window && window.Notification.permission === 'default') {
      window.Notification.requestPermission();
    }
  }

  getMyNotifications(): Observable<Notification[]> {
    return this.http.get<Notification[]>(this.apiUrl);
  }

  getUnreadCount(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.apiUrl}/unread-count`);
  }

  markAsRead(id: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}/read`, {});
  }

  markAllRead(): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/read-all`, {});
  }

  updateLocalNotificationAsRead(id: number): void {
    const current = this.notificationsSubject.value;
    const updated = current.map(n => n.id === id ? { ...n, isRead: true } : n);
    this.notificationsSubject.next(updated);
    
    const unreadCount = updated.filter(n => !n.isRead).length;
    this.unreadCountSubject.next(unreadCount);
  }

  updateAllLocalNotificationsAsRead(): void {
    const current = this.notificationsSubject.value;
    const updated = current.map(n => ({ ...n, isRead: true }));
    this.notificationsSubject.next(updated);
    this.unreadCountSubject.next(0);
  }
}
