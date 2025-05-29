import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { MessageQueueComponent } from './components/message-queue/message-queue.component';
import { UserManagementComponent } from './components/user-management/user-management.component';
import { ChatComponent } from './components/chat/chat.component';
import { AnalyticsComponent } from './components/analytics/analytics.component';
import { SettingsComponent } from './components/settings/settings.component';
import { interval, Subscription } from 'rxjs';
import { ApiService } from './services/api.service';

interface Tab {
  id: string;
  label: string;
  icon: string;
  badge?: number;
  disabled?: boolean;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    DashboardComponent,
    MessageQueueComponent,
    UserManagementComponent,
    ChatComponent,
    AnalyticsComponent,
    SettingsComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'Redis Manager';
  activeTab = 'dashboard';
  mobileMenuOpen = false;
  connectionStatus = true;
  systemStatus = 'Operational';
  lastUpdate = 'Just now';
  isLoading = false;
  isRefreshing = false;
  loadingMessage = 'Loading...';
  showQuickActions = false;

  tabs: Tab[] = [
    { id: 'dashboard', label: 'Dashboard', icon: 'fas fa-chart-line', badge: 0 },
    { id: 'messages', label: 'Messages', icon: 'fas fa-envelope', badge: 0 },
    { id: 'users', label: 'Users', icon: 'fas fa-users', badge: 0 },
    { id: 'chat', label: 'Chat', icon: 'fas fa-comments', badge: 0 },
    { id: 'analytics', label: 'Analytics', icon: 'fas fa-chart-bar', badge: 0 },
    { id: 'settings', label: 'Settings', icon: 'fas fa-cog', badge: 0 },
  ];

  toasts: Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message?: string;
  }> = [];

  private subscriptions: Subscription[] = [];
  private autoRefreshInterval?: Subscription;

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.initializeApp();
    this.setupAutoRefresh();
    this.checkConnectionStatus();
    
    // Check connection status every 10 seconds
    const connectionCheck = interval(10000).subscribe(() => {
      this.checkConnectionStatus();
    });
    
    this.subscriptions.push(connectionCheck);
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    if (this.autoRefreshInterval) {
      this.autoRefreshInterval.unsubscribe();
    }
  }

  private initializeApp() {
    this.isLoading = true;
    this.loadingMessage = 'Initializing application...';
    
    // Simulate initial load
    setTimeout(() => {
      this.isLoading = false;
      this.updateLastUpdate();
      this.showToast('success', 'Application loaded successfully');
    }, 1500);
  }

  private setupAutoRefresh() {
    // Auto-refresh every 30 seconds
    this.autoRefreshInterval = interval(30000).subscribe(() => {
      this.refreshAllData(true); // Silent refresh
    });
  }

  setActiveTab(tabId: string) {
    const tab = this.tabs.find(t => t.id === tabId);
    if (tab && !tab.disabled) {
      this.activeTab = tabId;
      // Reset badge when switching to tab
      tab.badge = 0;
    }
  }

  getTabClass(tabId: string): string {
    const tab = this.tabs.find(t => t.id === tabId);
    if (tab?.disabled) return 'nav-disabled';
    return tabId === this.activeTab ? 'nav-active' : 'nav-inactive';
  }

  getMobileTabClass(tabId: string): string {
    const tab = this.tabs.find(t => t.id === tabId);
    if (tab?.disabled) return 'nav-disabled';
    return tabId === this.activeTab ? 'mobile-nav-active' : 'mobile-nav-inactive';
  }

  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  refreshAllData(silent: boolean = false) {
    if (this.isRefreshing) return;
    
    this.isRefreshing = true;
    
    if (!silent) {
      this.loadingMessage = 'Refreshing data...';
      this.isLoading = true;
    }

    // Call API service refresh method
    this.apiService.refreshAll();
    
    // Simulate refresh delay
    setTimeout(() => {
      this.isRefreshing = false;
      this.isLoading = false;
      this.updateLastUpdate();
      
      if (!silent) {
        this.showToast('success', 'Data refreshed successfully');
      }
    }, 2000);
  }

  private checkConnectionStatus() {
    // Simple connection check - you can implement actual health check
    this.connectionStatus = navigator.onLine;
    
    // You can implement actual backend health check here
    /*
    this.apiService.healthCheck().subscribe({
      next: () => {
        this.connectionStatus = true;
        this.systemStatus = 'Operational';
      },
      error: () => {
        this.connectionStatus = false;
        this.systemStatus = 'Error';
      }
    });
    */
  }

  private updateLastUpdate() {
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    this.lastUpdate = timeString;
  }

  quickCreateMessage() {
    // Quick message creation
    const quickMessages = [
      'Process urgent order',
      'Send notification',
      'Update user data',
      'Generate report'
    ];
    
    const randomMessage = quickMessages[Math.floor(Math.random() * quickMessages.length)];
    
    this.apiService.createMessage(randomMessage, 'normal').subscribe({
      next: () => {
        this.showToast('success', 'Quick message created');
        this.updateMessagesBadge();
      },
      error: () => {
        this.showToast('error', 'Failed to create message');
      }
    });
  }

  private updateMessagesBadge() {
    const messagesTab = this.tabs.find(t => t.id === 'messages');
    if (messagesTab) {
      messagesTab.badge = (messagesTab.badge || 0) + 1;
    }
  }

  showToast(type: 'success' | 'error' | 'warning' | 'info', title: string, message?: string) {
    const toast = {
      id: Date.now().toString(),
      type,
      title,
      message
    };
    
    this.toasts.push(toast);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      this.removeToast(toast.id);
    }, 5000);
  }

  removeToast(id: string) {
    this.toasts = this.toasts.filter(toast => toast.id !== id);
  }

  trackByToastId(index: number, toast: any): string {
    return toast.id;
  }

  getToastClass(type: string): string {
    const classes = {
      success: 'bg-success-50 border border-success-200 text-success-800',
      error: 'bg-danger-50 border border-danger-200 text-danger-800',
      warning: 'bg-warning-50 border border-warning-200 text-warning-800',
      info: 'bg-primary-50 border border-primary-200 text-primary-800'
    };
    return classes[type as keyof typeof classes] || classes.info;
  }

  getToastIcon(type: string): string {
    const icons = {
      success: 'fas fa-check-circle text-success-600',
      error: 'fas fa-exclamation-circle text-danger-600',
      warning: 'fas fa-exclamation-triangle text-warning-600',
      info: 'fas fa-info-circle text-primary-600'
    };
    return icons[type as keyof typeof icons] || icons.info;
  }
}
