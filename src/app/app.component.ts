import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { MessageQueueComponent } from './components/message-queue/message-queue.component';
import { UserManagementComponent } from './components/user-management/user-management.component';
import { ChatComponent } from './components/chat/chat.component';
import { AnalyticsComponent } from './components/analytics/analytics.component';
import { SettingsComponent } from './components/settings/settings.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    // RouterOutlet,
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
export class AppComponent {
  title = 'Redis Manager';
  activeTab = 'dashboard';
  mobileMenuOpen = false;

  tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: 'fas fa-chart-line' },
    { id: 'messages', label: 'Messages', icon: 'fas fa-envelope' },
    { id: 'users', label: 'Users', icon: 'fas fa-users' },
    { id: 'chat', label: 'Chat', icon: 'fas fa-comments' },
    { id: 'analytics', label: 'Analytics', icon: 'fas fa-chart-bar' },
    { id: 'settings', label: 'Settings', icon: 'fas fa-cog' },
  ];

  constructor(private router: Router) {}

  ngOnInit() {
    // Auto-refresh data every 5 seconds
    setInterval(() => {
      this.refreshData();
    }, 5000);
  }

  setActiveTab(tabId: string) {
    this.activeTab = tabId;
  }

  getTabClass(tabId: string): string {
    return tabId === this.activeTab ? 'nav-active' : 'nav-inactive';
  }

  getMobileTabClass(tabId: string): string {
    return tabId === this.activeTab
      ? 'mobile-nav-active'
      : 'mobile-nav-inactive';
  }

  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  private refreshData() {
    // This will be implemented when we add the ApiService
    console.log('Refreshing data...');
  }
}
