import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-8">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-3xl font-bold text-slate-800 mb-2">Settings</h1>
          <p class="text-slate-600">Configure your system preferences and settings</p>
        </div>
        
        <div class="flex items-center space-x-4 mt-4 sm:mt-0">
          <button 
            class="btn-secondary"
            (click)="resetToDefaults()">
            <i class="fas fa-undo mr-2"></i>
            Reset to Defaults
          </button>
          
          <button 
            class="btn-primary"
            (click)="saveSettings()"
            [disabled]="isSaving">
            <i class="fas fa-save mr-2" [class.fa-spin]="isSaving"></i>
            {{ isSaving ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>
      </div>

      <!-- Settings Tabs -->
      <div class="glass-card rounded-xl overflow-hidden">
        <!-- Tab Navigation -->
        <div class="border-b border-slate-200 bg-white/50">
          <nav class="flex space-x-8 px-6">
            <button 
              *ngFor="let tab of settingsTabs"
              (click)="activeTab = tab.id"
              [class]="getTabClass(tab.id)"
              class="py-4 px-2 text-sm font-medium transition-colors duration-200 border-b-2 border-transparent">
              <i [class]="tab.icon" class="mr-2"></i>
              {{ tab.label }}
            </button>
          </nav>
        </div>

        <!-- Tab Content -->
        <div class="p-6">
          <!-- General Settings -->
          <div *ngIf="activeTab === 'general'" class="space-y-6">
            <h3 class="text-lg font-semibold text-slate-800 mb-4">General Configuration</h3>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-2">System Name</label>
                <input 
                  type="text" 
                  [(ngModel)]="settings.general.systemName"
                  class="input-field">
                <p class="text-sm text-slate-500 mt-1">Display name for your Redis system</p>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-2">Default Language</label>
                <select [(ngModel)]="settings.general.language" class="select-field">
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                </select>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-2">Timezone</label>
                <select [(ngModel)]="settings.general.timezone" class="select-field">
                  <option value="UTC">UTC</option>
                  <option value="EST">Eastern Time</option>
                  <option value="PST">Pacific Time</option>
                  <option value="GMT">Greenwich Mean Time</option>
                </select>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-2">Date Format</label>
                <select [(ngModel)]="settings.general.dateFormat" class="select-field">
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>
            </div>

            <div class="border-t border-slate-200 pt-6">
              <h4 class="font-medium text-slate-800 mb-4">System Behavior</h4>
              
              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <div>
                    <label class="font-medium text-slate-700">Auto-refresh Data</label>
                    <p class="text-sm text-slate-500">Automatically refresh dashboard data</p>
                  </div>
                  <input 
                    type="checkbox" 
                    [(ngModel)]="settings.general.autoRefresh"
                    class="rounded border-slate-300 text-primary-600 focus:ring-primary-500">
                </div>
                
                <div class="flex items-center justify-between">
                  <div>
                    <label class="font-medium text-slate-700">Show Notifications</label>
                    <p class="text-sm text-slate-500">Display system notifications</p>
                  </div>
                  <input 
                    type="checkbox" 
                    [(ngModel)]="settings.general.showNotifications"
                    class="rounded border-slate-300 text-primary-600 focus:ring-primary-500">
                </div>
              </div>
            </div>
          </div>

          <!-- Queue Settings -->
          <div *ngIf="activeTab === 'queue'" class="space-y-6">
            <h3 class="text-lg font-semibold text-slate-800 mb-4">Queue Configuration</h3>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-2">Default Priority</label>
                <select [(ngModel)]="settings.queue.defaultPriority" class="select-field">
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="normal">Normal</option>
                  <option value="low">Low</option>
                </select>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-2">Max Retry Attempts</label>
                <input 
                  type="number" 
                  [(ngModel)]="settings.queue.maxRetries"
                  min="0"
                  max="10"
                  class="input-field">
              </div>
              
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-2">Processing Timeout (seconds)</label>
                <input 
                  type="number" 
                  [(ngModel)]="settings.queue.processingTimeout"
                  min="10"
                  max="3600"
                  class="input-field">
              </div>
              
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-2">Batch Size</label>
                <input 
                  type="number" 
                  [(ngModel)]="settings.queue.batchSize"
                  min="1"
                  max="100"
                  class="input-field">
              </div>
            </div>

            <div class="border-t border-slate-200 pt-6">
              <h4 class="font-medium text-slate-800 mb-4">Queue Behavior</h4>
              
              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <div>
                    <label class="font-medium text-slate-700">Auto-process Messages</label>
                    <p class="text-sm text-slate-500">Automatically process messages in queue</p>
                  </div>
                  <input 
                    type="checkbox" 
                    [(ngModel)]="settings.queue.autoProcess"
                    class="rounded border-slate-300 text-primary-600 focus:ring-primary-500">
                </div>
                
                <div class="flex items-center justify-between">
                  <div>
                    <label class="font-medium text-slate-700">Priority-based Processing</label>
                    <p class="text-sm text-slate-500">Process higher priority messages first</p>
                  </div>
                  <input 
                    type="checkbox" 
                    [(ngModel)]="settings.queue.priorityBased"
                    class="rounded border-slate-300 text-primary-600 focus:ring-primary-500">
                </div>
              </div>
            </div>
          </div>

          <!-- Notifications Settings -->
          <div *ngIf="activeTab === 'notifications'" class="space-y-6">
            <h3 class="text-lg font-semibold text-slate-800 mb-4">Notification Preferences</h3>
            
            <div class="space-y-6">
              <div class="bg-slate-50 rounded-lg p-4">
                <h4 class="font-medium text-slate-800 mb-4">Email Notifications</h4>
                
                <div class="space-y-3">
                  <div class="flex items-center justify-between">
                    <div>
                      <label class="font-medium text-slate-700">System Alerts</label>
                      <p class="text-sm text-slate-500">Critical system notifications</p>
                    </div>
                    <input 
                      type="checkbox" 
                      [(ngModel)]="settings.notifications.email.systemAlerts"
                      class="rounded border-slate-300 text-primary-600 focus:ring-primary-500">
                  </div>
                  
                  <div class="flex items-center justify-between">
                    <div>
                      <label class="font-medium text-slate-700">Queue Status</label>
                      <p class="text-sm text-slate-500">Updates on queue processing</p>
                    </div>
                    <input 
                      type="checkbox" 
                      [(ngModel)]="settings.notifications.email.queueStatus"
                      class="rounded border-slate-300 text-primary-600 focus:ring-primary-500">
                  </div>
                  
                  <div class="flex items-center justify-between">
                    <div>
                      <label class="font-medium text-slate-700">Daily Reports</label>
                      <p class="text-sm text-slate-500">Daily activity summaries</p>
                    </div>
                    <input 
                      type="checkbox" 
                      [(ngModel)]="settings.notifications.email.dailyReports"
                      class="rounded border-slate-300 text-primary-600 focus:ring-primary-500">
                  </div>
                </div>
              </div>

              <div class="bg-slate-50 rounded-lg p-4">
                <h4 class="font-medium text-slate-800 mb-4">In-App Notifications</h4>
                
                <div class="space-y-3">
                  <div class="flex items-center justify-between">
                    <div>
                      <label class="font-medium text-slate-700">New Messages</label>
                      <p class="text-sm text-slate-500">Notify when new messages arrive</p>
                    </div>
                    <input 
                      type="checkbox" 
                      [(ngModel)]="settings.notifications.inApp.newMessages"
                      class="rounded border-slate-300 text-primary-600 focus:ring-primary-500">
                  </div>
                  
                  <div class="flex items-center justify-between">
                    <div>
                      <label class="font-medium text-slate-700">Processing Errors</label>
                      <p class="text-sm text-slate-500">Alert on message processing failures</p>
                    </div>
                    <input 
                      type="checkbox" 
                      [(ngModel)]="settings.notifications.inApp.processingErrors"
                      class="rounded border-slate-300 text-primary-600 focus:ring-primary-500">
                  </div>
                  
                  <div class="flex items-center justify-between">
                    <div>
                      <label class="font-medium text-slate-700">User Activity</label>
                      <p class="text-sm text-slate-500">Updates on user actions</p>
                    </div>
                    <input 
                      type="checkbox" 
                      [(ngModel)]="settings.notifications.inApp.userActivity"
                      class="rounded border-slate-300 text-primary-600 focus:ring-primary-500">
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Security Settings -->
          <div *ngIf="activeTab === 'security'" class="space-y-6">
            <h3 class="text-lg font-semibold text-slate-800 mb-4">Security Configuration</h3>
            
            <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div class="flex items-start">
                <i class="fas fa-exclamation-triangle text-yellow-600 mt-1 mr-3"></i>
                <div>
                  <h4 class="font-medium text-yellow-800">Important Security Notice</h4>
                  <p class="text-sm text-yellow-700 mt-1">Changes to security settings may affect system access and functionality.</p>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-2">Session Timeout (minutes)</label>
                <input 
                  type="number" 
                  [(ngModel)]="settings.security.sessionTimeout"
                  min="5"
                  max="480"
                  class="input-field">
              </div>
              
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-2">Max Login Attempts</label>
                <input 
                  type="number" 
                  [(ngModel)]="settings.security.maxLoginAttempts"
                  min="3"
                  max="10"
                  class="input-field">
              </div>
            </div>

            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <div>
                  <label class="font-medium text-slate-700">Require Two-Factor Authentication</label>
                  <p class="text-sm text-slate-500">Enhanced security for user accounts</p>
                </div>
                <input 
                  type="checkbox" 
                  [(ngModel)]="settings.security.requireTwoFactor"
                  class="rounded border-slate-300 text-primary-600 focus:ring-primary-500">
              </div>
              
              <div class="flex items-center justify-between">
                <div>
                  <label class="font-medium text-slate-700">Force HTTPS</label>
                  <p class="text-sm text-slate-500">Redirect all HTTP requests to HTTPS</p>
                </div>
                <input 
                  type="checkbox" 
                  [(ngModel)]="settings.security.forceHttps"
                  class="rounded border-slate-300 text-primary-600 focus:ring-primary-500">
              </div>
              
              <div class="flex items-center justify-between">
                <div>
                  <label class="font-medium text-slate-700">API Rate Limiting</label>
                  <p class="text-sm text-slate-500">Limit API requests per user</p>
                </div>
                <input 
                  type="checkbox" 
                  [(ngModel)]="settings.security.rateLimiting"
                  class="rounded border-slate-300 text-primary-600 focus:ring-primary-500">
              </div>
            </div>
          </div>

          <!-- System Settings -->
          <div *ngIf="activeTab === 'system'" class="space-y-6">
            <h3 class="text-lg font-semibold text-slate-800 mb-4">System Configuration</h3>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-2">Redis Host</label>
                <input 
                  type="text" 
                  [(ngModel)]="settings.system.redisHost"
                  class="input-field">
              </div>
              
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-2">Redis Port</label>
                <input 
                  type="number" 
                  [(ngModel)]="settings.system.redisPort"
                  min="1"
                  max="65535"
                  class="input-field">
              </div>
              
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-2">Database Index</label>
                <input 
                  type="number" 
                  [(ngModel)]="settings.system.redisDb"
                  min="0"
                  max="15"
                  class="input-field">
              </div>
              
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-2">Connection Pool Size</label>
                <input 
                  type="number" 
                  [(ngModel)]="settings.system.connectionPoolSize"
                  min="1"
                  max="100"
                  class="input-field">
              </div>
            </div>

            <div class="border-t border-slate-200 pt-6">
              <h4 class="font-medium text-slate-800 mb-4">Performance Settings</h4>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-2">Memory Limit (MB)</label>
                  <input 
                    type="number" 
                    [(ngModel)]="settings.system.memoryLimit"
                    min="128"
                    max="8192"
                    class="input-field">
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-2">Log Level</label>
                  <select [(ngModel)]="settings.system.logLevel" class="select-field">
                    <option value="debug">Debug</option>
                    <option value="info">Info</option>
                    <option value="warn">Warning</option>
                    <option value="error">Error</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- System Actions -->
            <div class="border-t border-slate-200 pt-6">
              <h4 class="font-medium text-slate-800 mb-4">System Actions</h4>
              
              <div class="flex flex-wrap gap-4">
                <button class="btn-secondary">
                  <i class="fas fa-sync mr-2"></i>
                  Restart Services
                </button>
                
                <button class="btn-secondary">
                  <i class="fas fa-broom mr-2"></i>
                  Clear Cache
                </button>
                
                <button class="btn-secondary">
                  <i class="fas fa-download mr-2"></i>
                  Export Logs
                </button>
                
                <button class="btn-danger">
                  <i class="fas fa-database mr-2"></i>
                  Flush Database
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Save Confirmation -->
      <div *ngIf="showSaveConfirmation" class="fixed bottom-4 right-4 bg-success-100 border border-success-200 text-success-800 px-4 py-3 rounded-lg shadow-lg animate-slide-up">
        <div class="flex items-center">
          <i class="fas fa-check-circle mr-2"></i>
          <span>Settings saved successfully!</span>
        </div>
      </div>
    </div>
  `
})
export class SettingsComponent implements OnInit {
  activeTab = 'general';
  isSaving = false;
  showSaveConfirmation = false;

  settingsTabs = [
    { id: 'general', label: 'General', icon: 'fas fa-cog' },
    { id: 'queue', label: 'Queue', icon: 'fas fa-list' },
    { id: 'notifications', label: 'Notifications', icon: 'fas fa-bell' },
    { id: 'security', label: 'Security', icon: 'fas fa-shield-alt' },
    { id: 'system', label: 'System', icon: 'fas fa-server' }
  ];

  settings = {
    general: {
      systemName: 'Redis Manager',
      language: 'en',
      timezone: 'UTC',
      dateFormat: 'MM/DD/YYYY',
      autoRefresh: true,
      showNotifications: true
    },
    queue: {
      defaultPriority: 'normal',
      maxRetries: 3,
      processingTimeout: 300,
      batchSize: 10,
      autoProcess: false,
      priorityBased: true
    },
    notifications: {
      email: {
        systemAlerts: true,
        queueStatus: true,
        dailyReports: false
      },
      inApp: {
        newMessages: true,
        processingErrors: true,
        userActivity: false
      }
    },
    security: {
      sessionTimeout: 60,
      maxLoginAttempts: 5,
      requireTwoFactor: false,
      forceHttps: true,
      rateLimiting: true
    },
    system: {
      redisHost: 'localhost',
      redisPort: 6379,
      redisDb: 0,
      connectionPoolSize: 10,
      memoryLimit: 512,
      logLevel: 'info'
    }
  };

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadSettings();
  }

  loadSettings() {
    // In a real app, load settings from backend
    console.log('Loading settings...');
  }

  saveSettings() {
    this.isSaving = true;
    
    // Simulate save operation
    setTimeout(() => {
      this.isSaving = false;
      this.showSaveConfirmation = true;
      
      // Hide confirmation after 3 seconds
      setTimeout(() => {
        this.showSaveConfirmation = false;
      }, 3000);
      
      console.log('Settings saved:', this.settings);
    }, 1500);
  }

  resetToDefaults() {
    if (confirm('Are you sure you want to reset all settings to defaults? This cannot be undone.')) {
      this.settings = {
        general: {
          systemName: 'Redis Manager',
          language: 'en',
          timezone: 'UTC',
          dateFormat: 'MM/DD/YYYY',
          autoRefresh: true,
          showNotifications: true
        },
        queue: {
          defaultPriority: 'normal',
          maxRetries: 3,
          processingTimeout: 300,
          batchSize: 10,
          autoProcess: false,
          priorityBased: true
        },
        notifications: {
          email: {
            systemAlerts: true,
            queueStatus: true,
            dailyReports: false
          },
          inApp: {
            newMessages: true,
            processingErrors: true,
            userActivity: false
          }
        },
        security: {
          sessionTimeout: 60,
          maxLoginAttempts: 5,
          requireTwoFactor: false,
          forceHttps: true,
          rateLimiting: true
        },
        system: {
          redisHost: 'localhost',
          redisPort: 6379,
          redisDb: 0,
          connectionPoolSize: 10,
          memoryLimit: 512,
          logLevel: 'info'
        }
      };
    }
  }

  getTabClass(tabId: string): string {
    return tabId === this.activeTab 
      ? 'text-primary-600 border-primary-600' 
      : 'text-slate-500 hover:text-slate-700 hover:border-slate-300';
  }
}