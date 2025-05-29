import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, AnalyticsData } from '../../services/api.service';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-8">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-3xl font-bold text-slate-800 mb-2">Analytics Dashboard</h1>
          <p class="text-slate-600">Comprehensive insights and reporting for your system</p>
        </div>
        
        <div class="flex items-center space-x-4 mt-4 sm:mt-0">
          <select 
            [(ngModel)]="selectedTimeRange"
            (ngModelChange)="loadAnalytics()"
            class="select-field text-sm">
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
          
          <button 
            class="btn-secondary" 
            (click)="loadAnalytics()"
            [disabled]="isLoading">
            <i class="fas fa-sync mr-2" [class.fa-spin]="isLoading"></i>
            Refresh
          </button>
          
          <button class="btn-primary">
            <i class="fas fa-download mr-2"></i>
            Export
          </button>
        </div>
      </div>

      <!-- Key Metrics -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div class="glass-card rounded-xl p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-slate-600 mb-1">Total Messages</p>
              <p class="text-3xl font-bold text-slate-800">{{ analytics?.totalMessages || 0 | number }}</p>
              <p class="text-sm text-success-600 mt-1">
                <i class="fas fa-arrow-up mr-1"></i>
                +{{ getGrowthPercentage('messages') }}% from last period
              </p>
            </div>
            <div class="w-12 h-12 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
              <i class="fas fa-envelope text-white text-xl"></i>
            </div>
          </div>
        </div>

        <div class="glass-card rounded-xl p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-slate-600 mb-1">Active Users</p>
              <p class="text-3xl font-bold text-slate-800">{{ analytics?.topUsers?.length || 0 }}</p>
              <p class="text-sm text-success-600 mt-1">
                <i class="fas fa-arrow-up mr-1"></i>
                +{{ getGrowthPercentage('users') }}% active
              </p>
            </div>
            <div class="w-12 h-12 bg-gradient-to-r from-success-500 to-success-600 rounded-lg flex items-center justify-center">
              <i class="fas fa-users text-white text-xl"></i>
            </div>
          </div>
        </div>

        <div class="glass-card rounded-xl p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-slate-600 mb-1">Avg Messages/Hour</p>
              <p class="text-3xl font-bold text-slate-800">{{ analytics?.averageMessagesPerHour || 0 | number:'1.1-1' }}</p>
              <p class="text-sm text-warning-600 mt-1">
                <i class="fas fa-clock mr-1"></i>
                Peak: {{ analytics?.peakHour || 0 }}:00
              </p>
            </div>
            <div class="w-12 h-12 bg-gradient-to-r from-warning-500 to-warning-600 rounded-lg flex items-center justify-center">
              <i class="fas fa-chart-line text-white text-xl"></i>
            </div>
          </div>
        </div>

        <div class="glass-card rounded-xl p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-slate-600 mb-1">Peak Day</p>
              <p class="text-2xl font-bold text-slate-800">{{ analytics?.peakDay || 'N/A' }}</p>
              <p class="text-sm text-primary-600 mt-1">
                <i class="fas fa-calendar mr-1"></i>
                Highest activity
              </p>
            </div>
            <div class="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <i class="fas fa-calendar-alt text-white text-xl"></i>
            </div>
          </div>
        </div>
      </div>

      <!-- Charts Section -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Message Activity Chart -->
        <div class="glass-card rounded-xl p-6">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-semibold text-slate-800">Message Activity</h2>
            <div class="flex items-center space-x-2">
              <div class="w-3 h-3 bg-primary-500 rounded-full"></div>
              <span class="text-sm text-slate-600">Messages</span>
            </div>
          </div>
          
          <!-- Simple bar chart simulation -->
          <div class="space-y-3">
            <div *ngFor="let day of last7Days; let i = index" class="flex items-center justify-between">
              <span class="text-sm text-slate-600 w-16">{{ day }}</span>
              <div class="flex-1 mx-4">
                <div class="w-full bg-slate-200 rounded-full h-2">
                  <div 
                    class="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full transition-all duration-500"
                    [style.width.%]="getMessageActivityPercentage(i)">
                  </div>
                </div>
              </div>
              <span class="text-sm font-medium text-slate-800 w-12 text-right">{{ getMessageCount(i) }}</span>
            </div>
          </div>
        </div>

        <!-- User Activity Distribution -->
        <div class="glass-card rounded-xl p-6">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-semibold text-slate-800">User Activity Distribution</h2>
            <button class="btn-secondary text-sm px-3 py-1">
              <i class="fas fa-expand-alt mr-1"></i>
              View All
            </button>
          </div>
          
          <!-- Donut chart simulation -->
          <div class="relative w-40 h-40 mx-auto mb-6">
            <div class="absolute inset-0 rounded-full bg-gradient-to-r from-primary-200 to-primary-300"></div>
            <div class="absolute inset-2 rounded-full bg-white flex items-center justify-center">
              <div class="text-center">
                <p class="text-2xl font-bold text-slate-800">{{ getTotalActiveUsers() }}</p>
                <p class="text-sm text-slate-600">Total</p>
              </div>
            </div>
          </div>
          
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-2">
                <div class="w-3 h-3 bg-primary-500 rounded-full"></div>
                <span class="text-sm text-slate-600">Active Users</span>
              </div>
              <span class="text-sm font-medium text-slate-800">85%</span>
            </div>
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-2">
                <div class="w-3 h-3 bg-slate-300 rounded-full"></div>
                <span class="text-sm text-slate-600">Inactive Users</span>
              </div>
              <span class="text-sm font-medium text-slate-800">15%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Top Users and Trending Topics -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Top Users -->
        <div class="glass-card rounded-xl p-6">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-semibold text-slate-800">Top Users</h2>
            <span class="text-sm text-slate-500">{{ selectedTimeRange.toUpperCase() }}</span>
          </div>
          
          <div class="space-y-4" *ngIf="analytics?.topUsers && analytics?.topUsers!.length > 0">
            <div 
              *ngFor="let user of analytics?.topUsers?.slice(0, 10); let i = index"
              class="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors duration-200">
              
              <div class="flex items-center space-x-3">
                <div class="w-8 h-8 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
                  <span class="text-white text-sm font-medium">{{ i + 1 }}</span>
                </div>
                
                <div>
                  <p class="font-medium text-slate-800">{{ user.username }}</p>
                  <p class="text-sm text-slate-500">{{ user.messageCount }} messages</p>
                </div>
              </div>
              
              <div class="text-right">
                <div class="w-20 bg-slate-200 rounded-full h-2 mb-1">
                  <div 
                    class="bg-gradient-to-r from-success-500 to-success-600 h-2 rounded-full"
                    [style.width.%]="(user.messageCount / getMaxMessageCount()) * 100">
                  </div>
                </div>
                <span class="text-xs text-slate-500">{{ ((user.messageCount / getTotalMessages()) * 100) | number:'1.1-1' }}%</span>
              </div>
            </div>
          </div>

          <div *ngIf="!analytics?.topUsers || analytics?.topUsers!.length === 0" class="text-center py-8">
            <i class="fas fa-users text-slate-400 text-3xl mb-2"></i>
            <p class="text-slate-500">No user activity data available</p>
          </div>
        </div>

        <!-- Trending Topics -->
        <div class="glass-card rounded-xl p-6">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-semibold text-slate-800">Trending Topics</h2>
            <span class="text-sm text-slate-500">{{ selectedTimeRange.toUpperCase() }}</span>
          </div>
          
          <div class="space-y-4" *ngIf="trendingTopics && trendingTopics.length > 0">
            <div 
              *ngFor="let topic of trendingTopics.slice(0, 10); let i = index"
              class="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors duration-200">
              
              <div class="flex items-center space-x-3">
                <div class="w-8 h-8 bg-gradient-to-r from-warning-500 to-warning-600 rounded-full flex items-center justify-center">
                  <span class="text-white text-sm font-medium">#</span>
                </div>
                
                <div>
                  <p class="font-medium text-slate-800">{{ topic.topic }}</p>
                  <p class="text-sm text-slate-500">{{ topic.frequency }} mentions</p>
                </div>
              </div>
              
              <div class="text-right">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-warning-100 text-warning-800">
                  <i class="fas fa-arrow-up mr-1"></i>
                  Trending
                </span>
              </div>
            </div>
          </div>

          <div *ngIf="!trendingTopics || trendingTopics.length === 0" class="text-center py-8">
            <i class="fas fa-hashtag text-slate-400 text-3xl mb-2"></i>
            <p class="text-slate-500">No trending topics available</p>
          </div>
        </div>
      </div>

      <!-- System Performance -->
      <div class="glass-card rounded-xl p-6">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-semibold text-slate-800">System Performance</h2>
          <div class="flex items-center space-x-2">
            <div class="w-3 h-3 bg-success-500 rounded-full animate-pulse"></div>
            <span class="text-sm text-slate-600">Real-time</span>
          </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <!-- Response Time -->
          <div class="text-center">
            <div class="relative w-24 h-24 mx-auto mb-4">
              <div class="absolute inset-0 rounded-full bg-gradient-to-r from-success-200 to-success-300"></div>
              <div class="absolute inset-2 rounded-full bg-white flex items-center justify-center">
                <span class="text-lg font-bold text-success-600">{{ getAverageResponseTime() }}ms</span>
              </div>
            </div>
            <h3 class="font-semibold text-slate-800 mb-1">Response Time</h3>
            <p class="text-sm text-slate-500">Average response time</p>
          </div>
          
          <!-- Throughput -->
          <div class="text-center">
            <div class="relative w-24 h-24 mx-auto mb-4">
              <div class="absolute inset-0 rounded-full bg-gradient-to-r from-primary-200 to-primary-300"></div>
              <div class="absolute inset-2 rounded-full bg-white flex items-center justify-center">
                <span class="text-lg font-bold text-primary-600">{{ getThroughput() }}/s</span>
              </div>
            </div>
            <h3 class="font-semibold text-slate-800 mb-1">Throughput</h3>
            <p class="text-sm text-slate-500">Messages per second</p>
          </div>
          
          <!-- Uptime -->
          <div class="text-center">
            <div class="relative w-24 h-24 mx-auto mb-4">
              <div class="absolute inset-0 rounded-full bg-gradient-to-r from-warning-200 to-warning-300"></div>
              <div class="absolute inset-2 rounded-full bg-white flex items-center justify-center">
                <span class="text-lg font-bold text-warning-600">99.9%</span>
              </div>
            </div>
            <h3 class="font-semibold text-slate-800 mb-1">Uptime</h3>
            <p class="text-sm text-slate-500">System availability</p>
          </div>
        </div>
      </div>

      <!-- Detailed Reports -->
      <div class="glass-card rounded-xl p-6">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-semibold text-slate-800">Detailed Reports</h2>
          <button class="btn-secondary text-sm px-3 py-1">
            <i class="fas fa-filter mr-1"></i>
            Filters
          </button>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button class="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors duration-200 text-left">
            <div class="flex items-center space-x-3 mb-2">
              <i class="fas fa-envelope text-primary-600"></i>
              <span class="font-medium text-slate-800">Message Report</span>
            </div>
            <p class="text-sm text-slate-500">Detailed message analytics and patterns</p>
          </button>
          
          <button class="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors duration-200 text-left">
            <div class="flex items-center space-x-3 mb-2">
              <i class="fas fa-users text-success-600"></i>
              <span class="font-medium text-slate-800">User Report</span>
            </div>
            <p class="text-sm text-slate-500">User engagement and activity analysis</p>
          </button>
          
          <button class="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors duration-200 text-left">
            <div class="flex items-center space-x-3 mb-2">
              <i class="fas fa-chart-bar text-warning-600"></i>
              <span class="font-medium text-slate-800">Performance Report</span>
            </div>
            <p class="text-sm text-slate-500">System performance and optimization</p>
          </button>
          
          <button class="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors duration-200 text-left">
            <div class="flex items-center space-x-3 mb-2">
              <i class="fas fa-exclamation-triangle text-danger-600"></i>
              <span class="font-medium text-slate-800">Error Report</span>
            </div>
            <p class="text-sm text-slate-500">Error tracking and debugging insights</p>
          </button>
        </div>
      </div>
    </div>
  `
})
export class AnalyticsComponent implements OnInit, OnDestroy {
  analytics: AnalyticsData | null = null;
  trendingTopics: any[] = [];
  selectedTimeRange = '7d';
  isLoading = false;
  
  last7Days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  mockMessageData = [120, 85, 95, 110, 145, 88, 92]; // Mock data for chart
  
  private subscriptions: Subscription[] = [];

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadAnalytics();
    
    // Auto-refresh every 30 seconds
    const refreshInterval = interval(30000).subscribe(() => {
      this.loadAnalytics(true); // Silent refresh
    });
    
    this.subscriptions.push(refreshInterval);
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadAnalytics(silent: boolean = false) {
    if (!silent) {
      this.isLoading = true;
    }
    
    // Load main analytics data
    this.apiService.getAnalytics().subscribe({
      next: (response) => {
        if (response.success) {
          this.analytics = response.data;
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading analytics:', error);
        this.isLoading = false;
      }
    });

    // Load trending topics
    this.apiService.getTrendingTopics().subscribe({
      next: (response) => {
        if (response.success) {
          this.trendingTopics = response.data || [];
        }
      },
      error: (error) => console.error('Error loading trending topics:', error)
    });
  }

  // Helper methods for displaying data
  getGrowthPercentage(type: 'messages' | 'users'): number {
    // Mock growth calculation - in real app, calculate from historical data
    if (type === 'messages') {
      return Math.floor(Math.random() * 20) + 5; // 5-25% growth
    } else {
      return Math.floor(Math.random() * 15) + 3; // 3-18% growth
    }
  }

  getMessageActivityPercentage(dayIndex: number): number {
    const maxValue = Math.max(...this.mockMessageData);
    return (this.mockMessageData[dayIndex] / maxValue) * 100;
  }

  getMessageCount(dayIndex: number): number {
    return this.mockMessageData[dayIndex];
  }

  getTotalActiveUsers(): number {
    return this.analytics?.topUsers?.length || 0;
  }

  getMaxMessageCount(): number {
    if (!this.analytics?.topUsers) return 1;
    return Math.max(...this.analytics.topUsers.map(user => user.messageCount));
  }

  getTotalMessages(): number {
    if (!this.analytics?.topUsers) return 1;
    return this.analytics.topUsers.reduce((total, user) => total + user.messageCount, 0);
  }

  getAverageResponseTime(): number {
    // Mock response time - in real app, get from system metrics
    return Math.floor(Math.random() * 50) + 25; // 25-75ms
  }

  getThroughput(): number {
    // Mock throughput - in real app, calculate from message processing rate
    return Math.floor(Math.random() * 100) + 50; // 50-150 messages/second
  }
}