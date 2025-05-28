// src/app/components/dashboard/dashboard.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService, QueueStats, AnalyticsData } from '../../services/api.service';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-8">
      <!-- Header -->
      <div class="text-center">
        <h1 class="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-2">
          System Dashboard
        </h1>
        <p class="text-slate-600">Real-time overview of your Redis message queue system</p>
      </div>

      <!-- Quick Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div class="glass-card rounded-xl p-6 card-hover">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-slate-600 mb-1">Total Messages</p>
              <p class="text-3xl font-bold text-slate-800">{{ stats?.totalMessages || 0 }}</p>
              <p class="text-sm text-success-600 mt-1">
                <i class="fas fa-arrow-up mr-1"></i>
                +{{ analytics?.messagesLast24Hours || 0 }} today
              </p>
            </div>
            <div class="w-12 h-12 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
              <i class="fas fa-envelope text-white text-xl"></i>
            </div>
          </div>
        </div>

        <div class="glass-card rounded-xl p-6 card-hover">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-slate-600 mb-1">Processing</p>
              <p class="text-3xl font-bold text-slate-800">{{ stats?.processingMessages || 0 }}</p>
              <p class="text-sm text-warning-600 mt-1">
                <i class="fas fa-clock mr-1"></i>
                Active now
              </p>
            </div>
            <div class="w-12 h-12 bg-gradient-to-r from-warning-500 to-warning-600 rounded-lg flex items-center justify-center">
              <i class="fas fa-cog fa-spin text-white text-xl"></i>
            </div>
          </div>
        </div>

        <div class="glass-card rounded-xl p-6 card-hover">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-slate-600 mb-1">Completed</p>
              <p class="text-3xl font-bold text-slate-800">{{ stats?.completedMessages || 0 }}</p>
              <p class="text-sm text-success-600 mt-1">
                <i class="fas fa-check-circle mr-1"></i>
                {{ getSuccessRate() }}% success
              </p>
            </div>
            <div class="w-12 h-12 bg-gradient-to-r from-success-500 to-success-600 rounded-lg flex items-center justify-center">
              <i class="fas fa-check text-white text-xl"></i>
            </div>
          </div>
        </div>

        <div class="glass-card rounded-xl p-6 card-hover">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-slate-600 mb-1">Failed</p>
              <p class="text-3xl font-bold text-slate-800">{{ stats?.failedMessages || 0 }}</p>
              <p class="text-sm text-danger-600 mt-1">
                <i class="fas fa-exclamation-circle mr-1"></i>
                Need attention
              </p>
            </div>
            <div class="w-12 h-12 bg-gradient-to-r from-danger-500 to-danger-600 rounded-lg flex items-center justify-center">
              <i class="fas fa-times text-white text-xl"></i>
            </div>
          </div>
        </div>
      </div>

      <!-- Priority Breakdown -->
      <div class="glass-card rounded-xl p-6">
        <h2 class="text-xl font-semibold text-slate-800 mb-6">Message Priority Distribution</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="text-center">
            <div class="priority-urgent rounded-lg p-4 mb-2">
              <i class="fas fa-exclamation-triangle text-2xl mb-2"></i>
              <p class="text-xl font-bold">{{ stats?.priorityBreakdown?.urgent || 0 }}</p>
            </div>
            <p class="text-sm font-medium text-slate-600">Urgent</p>
          </div>
          <div class="text-center">
            <div class="priority-high rounded-lg p-4 mb-2">
              <i class="fas fa-arrow-up text-2xl mb-2"></i>
              <p class="text-xl font-bold">{{ stats?.priorityBreakdown?.high || 0 }}</p>
            </div>
            <p class="text-sm font-medium text-slate-600">High</p>
          </div>
          <div class="text-center">
            <div class="priority-normal rounded-lg p-4 mb-2">
              <i class="fas fa-minus text-2xl mb-2"></i>
              <p class="text-xl font-bold">{{ stats?.priorityBreakdown?.normal || 0 }}</p>
            </div>
            <p class="text-sm font-medium text-slate-600">Normal</p>
          </div>
          <div class="text-center">
            <div class="priority-low rounded-lg p-4 mb-2">
              <i class="fas fa-arrow-down text-2xl mb-2"></i>
              <p class="text-xl font-bold">{{ stats?.priorityBreakdown?.low || 0 }}</p>
            </div>
            <p class="text-sm font-medium text-slate-600">Low</p>
          </div>
        </div>
      </div>

      <!-- System Performance & Activity -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- System Performance -->
        <div class="glass-card rounded-xl p-6">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-semibold text-slate-800">System Performance</h2>
            <div class="flex items-center space-x-2">
              <div class="w-3 h-3 bg-success-500 rounded-full animate-pulse"></div>
              <span class="text-sm text-slate-600">Live</span>
            </div>
          </div>
          
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium text-slate-600">Queue Processing Rate</span>
              <span class="text-sm font-bold text-slate-800">{{ getProcessingRate() }}%</span>
            </div>
            <div class="w-full bg-slate-200 rounded-full h-2">
              <div 
                class="bg-gradient-to-r from-success-500 to-success-600 h-2 rounded-full transition-all duration-500"
                [style.width.%]="getProcessingRate()">
              </div>
            </div>

            <div class="flex items-center justify-between">
              <span class="text-sm font-medium text-slate-600">Memory Usage</span>
              <span class="text-sm font-bold text-slate-800">{{ getMemoryUsage() }}%</span>
            </div>
            <div class="w-full bg-slate-200 rounded-full h-2">
              <div 
                class="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full transition-all duration-500"
                [style.width.%]="getMemoryUsage()">
              </div>
            </div>

            <div class="flex items-center justify-between">
              <span class="text-sm font-medium text-slate-600">Average Response Time</span>
              <span class="text-sm font-bold text-slate-800">{{ getAverageResponseTime() }}ms</span>
            </div>
          </div>
        </div>

        <!-- Recent Activity -->
        <div class="glass-card rounded-xl p-6">
          <h2 class="text-xl font-semibold text-slate-800 mb-6">Recent Activity</h2>
          
          <div class="space-y-4">
            <div *ngFor="let activity of recentActivities" class="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
              <div [class]="getActivityIconClass(activity.type)" class="w-8 h-8 rounded-full flex items-center justify-center">
                <i [class]="getActivityIcon(activity.type)" class="text-sm text-white"></i>
              </div>
              <div class="flex-1">
                <p class="text-sm font-medium text-slate-800">{{ activity.message }}</p>
                <p class="text-xs text-slate-500">{{ formatTime(activity.timestamp) }}</p>
              </div>
            </div>
          </div>

          <div *ngIf="recentActivities.length === 0" class="text-center py-8">
            <i class="fas fa-clock text-slate-400 text-3xl mb-2"></i>
            <p class="text-slate-500">No recent activity</p>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="glass-card rounded-xl p-6">
        <h2 class="text-xl font-semibold text-slate-800 mb-6">Quick Actions</h2>
        
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button class="btn-primary flex flex-col items-center py-4" (click)="createTestMessage()">
            <i class="fas fa-plus text-xl mb-2"></i>
            <span class="text-sm">Add Test Message</span>
          </button>
          
          <button class="btn-secondary flex flex-col items-center py-4" (click)="processMessages()">
            <i class="fas fa-play text-xl mb-2"></i>
            <span class="text-sm">Process Queue</span>
          </button>
          
          <button class="btn-secondary flex flex-col items-center py-4" (click)="refreshData()">
            <i class="fas fa-sync text-xl mb-2"></i>
            <span class="text-sm">Refresh Data</span>
          </button>
          
          <button class="btn-secondary flex flex-col items-center py-4" (click)="viewAnalytics()">
            <i class="fas fa-chart-bar text-xl mb-2"></i>
            <span class="text-sm">View Analytics</span>
          </button>
        </div>
      </div>

      <!-- Trending Topics -->
      <div class="glass-card rounded-xl p-6" *ngIf="trendingTopics && trendingTopics.length > 0">
        <h2 class="text-xl font-semibold text-slate-800 mb-6">Trending Topics</h2>
        
        <div class="flex flex-wrap gap-2">
          <span 
            *ngFor="let topic of trendingTopics" 
            class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800">
            {{ topic.topic }}
            <span class="ml-2 text-xs bg-primary-200 text-primary-700 px-2 py-0.5 rounded-full">
              {{ topic.frequency }}
            </span>
          </span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .card-hover {
      transition: all 0.3s ease;
    }
    .card-hover:hover {
      transform: translateY(-4px);
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    }
  `]
})
export class DashboardComponent implements OnInit, OnDestroy {
  stats: QueueStats | null = null;
  analytics: AnalyticsData | null = null;
  trendingTopics: any[] = [];
  recentActivities: any[] = [
    {
      type: 'message_created',
      message: 'New message added to queue',
      timestamp: new Date()
    },
    {
      type: 'message_completed',
      message: 'Message processing completed',
      timestamp: new Date(Date.now() - 60000)
    },
    {
      type: 'user_joined',
      message: 'New user registered',
      timestamp: new Date(Date.now() - 120000)
    }
  ];

  private subscriptions: Subscription[] = [];

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadDashboardData();
    
    // Auto-refresh every 5 seconds
    const refreshInterval = interval(5000).subscribe(() => {
      this.loadDashboardData();
    });
    
    this.subscriptions.push(refreshInterval);
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadDashboardData() {
    // Load queue stats
    this.apiService.getQueueStats().subscribe({
      next: (response) => {
        if (response.success) {
          this.stats = response.stats;
        }
      },
      error: (error) => console.error('Error loading stats:', error)
    });

    // Load analytics
    this.apiService.getAnalytics().subscribe({
      next: (response) => {
        if (response.success) {
          this.analytics = response.data;
        }
      },
      error: (error) => console.error('Error loading analytics:', error)
    });

    // Load trending topics
    this.apiService.getTrendingTopics().subscribe({
      next: (response) => {
        if (response.success) {
          this.trendingTopics = response.data.slice(0, 10); // Top 10
        }
      },
      error: (error) => console.error('Error loading trending topics:', error)
    });
  }

  getSuccessRate(): number {
    if (!this.stats || this.stats.totalMessages === 0) return 0;
    return Math.round((this.stats.completedMessages / this.stats.totalMessages) * 100);
  }

  getProcessingRate(): number {
    if (!this.stats || this.stats.totalMessages === 0) return 0;
    const processed = this.stats.completedMessages + this.stats.failedMessages;
    return Math.round((processed / this.stats.totalMessages) * 100);
  }

  getMemoryUsage(): number {
    // Mock memory usage - you can implement actual memory monitoring
    return Math.floor(Math.random() * 30) + 40; // 40-70%
  }

  getAverageResponseTime(): number {
    // Mock response time - you can implement actual timing
    return Math.floor(Math.random() * 100) + 50; // 50-150ms
  }

  getActivityIconClass(type: string): string {
    const classes = {
      'message_created': 'bg-primary-500',
      'message_completed': 'bg-success-500',
      'message_failed': 'bg-danger-500',
      'user_joined': 'bg-warning-500'
    };
    return classes[type as keyof typeof classes] || 'bg-slate-500';
  }

  getActivityIcon(type: string): string {
    const icons = {
      'message_created': 'fas fa-plus',
      'message_completed': 'fas fa-check',
      'message_failed': 'fas fa-times',
      'user_joined': 'fas fa-user-plus'
    };
    return icons[type as keyof typeof icons] || 'fas fa-info';
  }

  formatTime(timestamp: Date): string {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes === 1) return '1 minute ago';
    if (minutes < 60) return `${minutes} minutes ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours === 1) return '1 hour ago';
    return `${hours} hours ago`;
  }

  // Quick Actions
  createTestMessage() {
    const testMessages = [
      'Process customer order #12345',
      'Send welcome email to new user',
      'Generate monthly report',
      'Backup database',
      'Update user preferences'
    ];
    
    const randomMessage = testMessages[Math.floor(Math.random() * testMessages.length)];
    const priorities = ['urgent', 'high', 'normal', 'low'];
    const randomPriority = priorities[Math.floor(Math.random() * priorities.length)];
    
    this.apiService.createMessage(randomMessage, randomPriority).subscribe({
      next: (response) => {
        console.log('Test message created:', response);
        this.loadDashboardData();
        this.addActivity('message_created', 'Test message added to queue');
      },
      error: (error) => console.error('Error creating test message:', error)
    });
  }

  processMessages() {
    this.apiService.processNextMessage().subscribe({
      next: (response) => {
        console.log('Processing message:', response);
        if (response.data.message) {
          // Auto-complete after 2 seconds (simulation)
          setTimeout(() => {
            this.apiService.completeMessage(response.data.message.id, true).subscribe({
              next: () => {
                this.loadDashboardData();
                this.addActivity('message_completed', 'Message processing completed');
              }
            });
          }, 2000);
        }
      },
      error: (error) => console.error('Error processing message:', error)
    });
  }

  refreshData() {
    this.loadDashboardData();
    this.addActivity('system', 'Dashboard data refreshed');
  }

  viewAnalytics() {
    // This would typically navigate to analytics tab
    console.log('Navigate to analytics...');
  }

  addActivity(type: string, message: string) {
    this.recentActivities.unshift({
      type,
      message,
      timestamp: new Date()
    });
    
    // Keep only last 5 activities
    this.recentActivities = this.recentActivities.slice(0, 5);
  }
}