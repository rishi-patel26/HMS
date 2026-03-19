import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../core/services/notification.service';
import { Notification } from '../../core/models/hms.model';

@Component({
  selector: 'app-notification-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notif-wrapper">
      <button class="notif-bell" (click)="togglePanel()" [class.has-unread]="unreadCount > 0">
        <i class="pi pi-bell"></i>
        @if (unreadCount > 0) {
          <span class="notif-badge">{{ unreadCount > 9 ? '9+' : unreadCount }}</span>
        }
      </button>

      @if (panelOpen) {
        <div class="notif-panel">
          <div class="notif-panel-header">
            <span>Notifications</span>
            @if (unreadCount > 0) {
              <button class="mark-all-btn" (click)="markAllRead()">Mark all read</button>
            }
          </div>
          <div class="notif-list">
            @if (notifications.length === 0) {
              <div class="notif-empty">No notifications yet</div>
            }
            @for (notif of notifications; track notif.id) {
              <div class="notif-item" [class.unread]="!notif.isRead" (click)="markRead(notif)">
                <div class="notif-icon" [attr.data-type]="notif.type">
                  <i [class]="getIcon(notif.type)"></i>
                </div>
                <div class="notif-body">
                  <p class="notif-message">{{ notif.message }}</p>
                  <span class="notif-time">{{ formatTime(notif.createdAt) }}</span>
                </div>
              </div>
            }
          </div>
        </div>
        <div class="notif-backdrop" (click)="closePanel()"></div>
      }
    </div>
  `,
  styles: [`
    .notif-wrapper { position: relative; display: inline-block; }

    .notif-bell {
      position: relative;
      width: 40px;
      height: 40px;
      border-radius: 10px;
      border: 2px solid #e2e8f0;
      background: white;
      color: #475569;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      i { font-size: 1.1rem; }
      &:hover { background: #f1f0fb; border-color: #4f46e5; color: #4f46e5; }
      &.has-unread { border-color: #4f46e5; color: #4f46e5; }
    }

    .notif-badge {
      position: absolute;
      top: -6px;
      right: -6px;
      background: #dc2626;
      color: white;
      border-radius: 999px;
      font-size: 0.65rem;
      font-weight: 700;
      min-width: 18px;
      height: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 4px;
      border: 2px solid white;
    }

    .notif-backdrop {
      position: fixed;
      inset: 0;
      z-index: 99;
    }

    .notif-panel {
      position: absolute;
      top: calc(100% + 8px);
      right: 0;
      width: 360px;
      max-height: 480px;
      background: white;
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.15);
      border: 1px solid #e2e8f0;
      z-index: 100;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .notif-panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.25rem;
      border-bottom: 1px solid #f1f5f9;
      font-size: 0.95rem;
      font-weight: 700;
      color: #1e293b;

      .mark-all-btn {
        background: none;
        border: none;
        color: #4f46e5;
        font-size: 0.8rem;
        font-weight: 600;
        cursor: pointer;
        padding: 0;
        &:hover { text-decoration: underline; }
      }
    }

    .notif-list {
      overflow-y: auto;
      flex: 1;
    }

    .notif-empty {
      padding: 2rem;
      text-align: center;
      color: #94a3b8;
      font-size: 0.88rem;
    }

    .notif-item {
      display: flex;
      gap: 0.75rem;
      padding: 0.85rem 1.25rem;
      cursor: pointer;
      transition: background 0.15s;
      border-bottom: 1px solid #f8fafc;
      &:hover { background: #f8f9ff; }
      &.unread { background: #f0f1ff; }
    }

    .notif-icon {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      &[data-type="APPOINTMENT"] { background: #dbeafe; i { color: #2563eb; } }
      &[data-type="BED_ALLOCATION"] { background: #d1fae5; i { color: #059669; } }
      &[data-type="GENERAL"] { background: #fef3c7; i { color: #d97706; } }
    }

    .notif-body {
      flex: 1;
      min-width: 0;
      .notif-message {
        margin: 0 0 0.2rem;
        font-size: 0.85rem;
        color: #334155;
        line-height: 1.4;
        word-break: break-word;
      }
      .notif-time { font-size: 0.75rem; color: #94a3b8; }
    }
  `]
})
export class NotificationPanelComponent implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  unreadCount = 0;
  panelOpen = false;
  private pollIntervalId: ReturnType<typeof setInterval> | null = null;

  constructor(
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadNotifications();
    // Poll every 30 seconds
    this.pollIntervalId = setInterval(() => this.loadNotifications(), 30000);
  }

  ngOnDestroy(): void {
    if (this.pollIntervalId) clearInterval(this.pollIntervalId);
  }

  loadNotifications(): void {
    this.notificationService.getMyNotifications().subscribe({
      next: (data) => {
        this.notifications = data;
        this.unreadCount = data.filter(n => !n.isRead).length;
        this.cdr.detectChanges();
      }
    });
  }

  togglePanel(): void {
    this.panelOpen = !this.panelOpen;
  }

  closePanel(): void {
    this.panelOpen = false;
  }

  markRead(notif: Notification): void {
    if (notif.isRead) return;
    this.notificationService.markAsRead(notif.id).subscribe({
      next: () => {
        notif.isRead = true;
        this.unreadCount = Math.max(0, this.unreadCount - 1);
        this.cdr.detectChanges();
      }
    });
  }

  markAllRead(): void {
    this.notificationService.markAllRead().subscribe({
      next: () => {
        this.notifications.forEach(n => n.isRead = true);
        this.unreadCount = 0;
        this.cdr.detectChanges();
      }
    });
  }

  getIcon(type: string): string {
    switch (type) {
      case 'APPOINTMENT': return 'pi pi-calendar';
      case 'BED_ALLOCATION': return 'pi pi-home';
      default: return 'pi pi-bell';
    }
  }

  formatTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    return date.toLocaleDateString('en-IN');
  }
}
