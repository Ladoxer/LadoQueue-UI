import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, MessageData } from '../../services/api.service';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-message-queue',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-8">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-3xl font-bold text-slate-800 mb-2">Message Queue</h1>
          <p class="text-slate-600">Manage and monitor your message processing pipeline</p>
        </div>
        
        <div class="flex items-center space-x-4 mt-4 sm:mt-0">
          <button 
            class="btn-primary" 
            (click)="processNextMessage()"
            [disabled]="isProcessing">
            <i class="fas fa-play mr-2" [class.fa-spin]="isProcessing"></i>
            {{ isProcessing ? 'Processing...' : 'Process Next' }}
          </button>
          
          <button class="btn-secondary" (click)="refreshMessages()">
            <i class="fas fa-sync mr-2"></i>
            Refresh
          </button>
        </div>
      </div>

      <!-- Create Message Form -->
      <div class="glass-card rounded-xl p-6">
        <h2 class="text-xl font-semibold text-slate-800 mb-6">Create New Message</h2>
        
        <form (ngSubmit)="createMessage()" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-slate-700 mb-2">Message Content</label>
              <input 
                type="text" 
                [(ngModel)]="newMessage.content"
                name="content"
                placeholder="Enter your message content..."
                class="input-field"
                required>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-2">Priority</label>
              <select 
                [(ngModel)]="newMessage.priority"
                name="priority"
                class="select-field">
                <option value="urgent">🔴 Urgent</option>
                <option value="high">🟠 High</option>
                <option value="normal">🟢 Normal</option>
                <option value="low">🔵 Low</option>
              </select>
            </div>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2">User ID (Optional)</label>
            <input 
              type="text" 
              [(ngModel)]="newMessage.userId"
              name="userId"
              placeholder="Enter user ID to associate message..."
              class="input-field">
          </div>
          
          <div class="flex justify-end">
            <button 
              type="submit" 
              class="btn-primary"
              [disabled]="!newMessage.content || isCreating">
              <i class="fas fa-plus mr-2" [class.fa-spin]="isCreating"></i>
              {{ isCreating ? 'Creating...' : 'Create Message' }}
            </button>
          </div>
        </form>
      </div>

      <!-- Messages List -->
      <div class="glass-card rounded-xl p-6">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-semibold text-slate-800">Message Queue</h2>
          
          <!-- Filter and Sort Controls -->
          <div class="flex items-center space-x-4">
            <select 
              [(ngModel)]="selectedFilter"
              (ngModelChange)="applyFilters()"
              class="select-field text-sm">
              <option value="all">All Messages</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
            
            <select 
              [(ngModel)]="selectedPriority"
              (ngModelChange)="applyFilters()"
              class="select-field text-sm">
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="normal">Normal</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        <!-- Messages Grid -->
        <div class="space-y-4" *ngIf="filteredMessages.length > 0">
          <div 
            *ngFor="let message of filteredMessages; trackBy: trackByMessageId" 
            class="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-all duration-200"
            [class]="getMessageCardClass(message)">
            
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <div class="flex items-center space-x-3 mb-2">
                  <!-- Priority Badge -->
                  <span [class]="getPriorityClass(message.priority)" class="px-2 py-1 rounded text-xs font-medium">
                    {{ message.priority.toUpperCase() }}
                  </span>
                  
                  <!-- Status Badge -->
                  <span [class]="getStatusClass(message.status)" class="px-2 py-1 rounded text-xs font-medium">
                    <i [class]="getStatusIcon(message.status)" class="mr-1"></i>
                    {{ message.status.toUpperCase() }}
                  </span>
                  
                  <!-- User Badge -->
                  <span *ngIf="message.username" class="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs">
                    <i class="fas fa-user mr-1"></i>
                    {{ message.username }}
                  </span>
                </div>
                
                <p class="text-slate-800 font-medium mb-2">{{ message.content }}</p>
                
                <div class="flex items-center space-x-4 text-sm text-slate-500">
                  <span>
                    <i class="fas fa-clock mr-1"></i>
                    {{ formatTimestamp(message.timestamp) }}
                  </span>
                  
                  <span *ngIf="message.processingStartTime">
                    <i class="fas fa-hourglass-half mr-1"></i>
                    Processing: {{ formatTimestamp(message.processingStartTime) }}
                  </span>
                  
                  <span *ngIf="message.completedTime">
                    <i class="fas fa-check-circle mr-1"></i>
                    Completed: {{ formatTimestamp(message.completedTime) }}
                  </span>
                  
                  <span *ngIf="message.retryCount && message.retryCount > 0">
                    <i class="fas fa-redo mr-1"></i>
                    Retries: {{ message.retryCount }}
                  </span>
                </div>
                
                <div *ngIf="message.error" class="mt-2 p-2 bg-danger-50 border border-danger-200 rounded text-sm text-danger-700">
                  <i class="fas fa-exclamation-triangle mr-1"></i>
                  {{ message.error }}
                </div>
              </div>
              
                              <!-- Action Buttons -->
              <div class="flex items-center space-x-2 ml-4">
                <button 
                  *ngIf="message.status === 'processing'"
                  (click)="completeMessage(message.id, true)"
                  class="btn-success text-xs px-3 py-1">
                  <i class="fas fa-check mr-1"></i>
                  Complete
                </button>
                
                <button 
                  *ngIf="message.status === 'processing'"
                  (click)="completeMessage(message.id, false)"
                  class="btn-danger text-xs px-3 py-1">
                  <i class="fas fa-times mr-1"></i>
                  Fail
                </button>
                
                <button 
                  *ngIf="message.status === 'failed' && message.retryCount! < 3"
                  (click)="retryMessage(message.id)"
                  class="btn-secondary text-xs px-3 py-1">
                  <i class="fas fa-redo mr-1"></i>
                  Retry
                </button>
                
                <button 
                  class="text-slate-400 hover:text-slate-600 p-1"
                  (click)="showMessageDetails(message)">
                  <i class="fas fa-info-circle"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div *ngIf="filteredMessages.length === 0" class="text-center py-12">
          <i class="fas fa-inbox text-slate-400 text-4xl mb-4"></i>
          <h3 class="text-lg font-medium text-slate-600 mb-2">No messages found</h3>
          <p class="text-slate-500 mb-4">
            {{ selectedFilter === 'all' ? 'Create your first message to get started' : 'No messages match your current filters' }}
          </p>
          <button 
            *ngIf="selectedFilter !== 'all'"
            (click)="clearFilters()"
            class="btn-secondary">
            Clear Filters
          </button>
        </div>
      </div>

      <!-- Message Details Modal -->
      <div 
        *ngIf="selectedMessageDetails" 
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        (click)="closeMessageDetails()">
        
        <div 
          class="glass-card rounded-xl p-6 max-w-2xl w-full max-h-96 overflow-y-auto"
          (click)="$event.stopPropagation()">
          
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-xl font-semibold text-slate-800">Message Details</h3>
            <button 
              (click)="closeMessageDetails()"
              class="text-slate-400 hover:text-slate-600">
              <i class="fas fa-times"></i>
            </button>
          </div>
          
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-slate-600 mb-1">Message ID</label>
              <p class="font-mono text-sm bg-slate-100 p-2 rounded">{{ selectedMessageDetails.id }}</p>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-slate-600 mb-1">Content</label>
              <p class="text-slate-800">{{ selectedMessageDetails.content }}</p>
            </div>
            
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-slate-600 mb-1">Priority</label>
                <span [class]="getPriorityClass(selectedMessageDetails.priority)" class="px-2 py-1 rounded text-xs font-medium">
                  {{ selectedMessageDetails.priority.toUpperCase() }}
                </span>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-slate-600 mb-1">Status</label>
                <span [class]="getStatusClass(selectedMessageDetails.status)" class="px-2 py-1 rounded text-xs font-medium">
                  {{ selectedMessageDetails.status.toUpperCase() }}
                </span>
              </div>
            </div>
            
            <div *ngIf="selectedMessageDetails.username">
              <label class="block text-sm font-medium text-slate-600 mb-1">Created By</label>
              <p class="text-slate-800">{{ selectedMessageDetails.username }}</p>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-slate-600 mb-1">Created At</label>
                <p class="text-slate-800">{{ formatTimestamp(selectedMessageDetails.timestamp) }}</p>
              </div>
              
              <div *ngIf="selectedMessageDetails.completedTime">
                <label class="block text-sm font-medium text-slate-600 mb-1">Completed At</label>
                <p class="text-slate-800">{{ formatTimestamp(selectedMessageDetails.completedTime) }}</p>
              </div>
            </div>
            
            <div *ngIf="selectedMessageDetails.error">
              <label class="block text-sm font-medium text-slate-600 mb-1">Error Details</label>
              <div class="bg-danger-50 border border-danger-200 rounded p-3 text-danger-700">
                {{ selectedMessageDetails.error }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .message-card-pending {
      @apply bg-blue-50 border-blue-200;
    }
    .message-card-processing {
      @apply bg-yellow-50 border-yellow-200;
    }
    .message-card-completed {
      @apply bg-green-50 border-green-200;
    }
    .message-card-failed {
      @apply bg-red-50 border-red-200;
    }
  `]
})
export class MessageQueueComponent implements OnInit, OnDestroy {
  messages: MessageData[] = [];
  filteredMessages: MessageData[] = [];
  selectedFilter = 'all';
  selectedPriority = 'all';
  selectedMessageDetails: MessageData | null = null;
  
  newMessage = {
    content: '',
    priority: 'normal',
    userId: ''
  };
  
  isCreating = false;
  isProcessing = false;
  
  private subscriptions: Subscription[] = [];

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadMessages();
    
    // Auto-refresh every 5 seconds
    const refreshInterval = interval(5000).subscribe(() => {
      this.loadMessages();
    });
    
    this.subscriptions.push(refreshInterval);
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadMessages() {
    this.apiService.getMessages().subscribe({
      next: (response) => {
        if (response.success) {
          this.messages = response.messages || [];
          this.applyFilters();
        }
      },
      error: (error) => console.error('Error loading messages:', error)
    });
  }

  createMessage() {
    if (!this.newMessage.content.trim()) return;
    
    this.isCreating = true;
    
    this.apiService.createMessage(
      this.newMessage.content,
      this.newMessage.priority,
      this.newMessage.userId || undefined
    ).subscribe({
      next: (response) => {
        console.log('Message created:', response);
        this.newMessage = { content: '', priority: 'normal', userId: '' };
        this.loadMessages();
        this.isCreating = false;
      },
      error: (error) => {
        console.error('Error creating message:', error);
        this.isCreating = false;
      }
    });
  }

  processNextMessage() {
    this.isProcessing = true;
    
    this.apiService.processNextMessage().subscribe({
      next: (response) => {
        console.log('Processing message:', response);
        this.loadMessages();
        this.isProcessing = false;
        
        // Auto-complete after 3 seconds for demo purposes
        if (response.data.message) {
          setTimeout(() => {
            this.completeMessage(response.data.message.id, true);
          }, 3000);
        }
      },
      error: (error) => {
        console.error('Error processing message:', error);
        this.isProcessing = false;
      }
    });
  }

  completeMessage(messageId: string, success: boolean) {
    this.apiService.completeMessage(messageId, success).subscribe({
      next: (response) => {
        console.log('Message completed:', response);
        this.loadMessages();
      },
      error: (error) => console.error('Error completing message:', error)
    });
  }

  retryMessage(messageId: string) {
    this.apiService.retryMessage(messageId).subscribe({
      next: (response) => {
        console.log('Message retried:', response);
        this.loadMessages();
      },
      error: (error) => console.error('Error retrying message:', error)
    });
  }

  applyFilters() {
    this.filteredMessages = this.messages.filter(message => {
      const statusMatch = this.selectedFilter === 'all' || message.status === this.selectedFilter;
      const priorityMatch = this.selectedPriority === 'all' || message.priority === this.selectedPriority;
      return statusMatch && priorityMatch;
    });
  }

  clearFilters() {
    this.selectedFilter = 'all';
    this.selectedPriority = 'all';
    this.applyFilters();
  }

  refreshMessages() {
    this.loadMessages();
  }

  showMessageDetails(message: MessageData) {
    this.selectedMessageDetails = message;
  }

  closeMessageDetails() {
    this.selectedMessageDetails = null;
  }

  trackByMessageId(index: number, message: MessageData): string {
    return message.id;
  }

  getMessageCardClass(message: MessageData): string {
    return `message-card-${message.status}`;
  }

  getPriorityClass(priority: string): string {
    const classes = {
      urgent: 'bg-red-100 text-red-800 border border-red-200',
      high: 'bg-orange-100 text-orange-800 border border-orange-200',
      normal: 'bg-blue-100 text-blue-800 border border-blue-200',
      low: 'bg-gray-100 text-gray-800 border border-gray-200'
    };
    return classes[priority as keyof typeof classes] || classes.normal;
  }

  getStatusClass(status: string): string {
    const classes = {
      pending: 'bg-blue-100 text-blue-800',
      processing: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800'
    };
    return classes[status as keyof typeof classes] || classes.pending;
  }

  getStatusIcon(status: string): string {
    const icons = {
      pending: 'fas fa-clock',
      processing: 'fas fa-spinner fa-spin',
      completed: 'fas fa-check',
      failed: 'fas fa-times'
    };
    return icons[status as keyof typeof icons] || icons.pending;
  }

  formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = diff / (1000 * 60 * 60);
    
    if (hours < 1) {
      const minutes = Math.floor(diff / (1000 * 60));
      return minutes <= 1 ? 'Just now' : `${minutes} minutes ago`;
    } else if (hours < 24) {
      return `${Math.floor(hours)} hours ago`;
    } else {
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    }
  }
}