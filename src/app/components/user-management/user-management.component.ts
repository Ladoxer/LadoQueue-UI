import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, UserData } from '../../services/api.service';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-8">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-3xl font-bold text-slate-800 mb-2">User Management</h1>
          <p class="text-slate-600">Manage users, roles, and permissions</p>
        </div>
        
        <div class="flex items-center space-x-4 mt-4 sm:mt-0">
          <button 
            class="btn-primary" 
            (click)="showCreateUserModal = true">
            <i class="fas fa-plus mr-2"></i>
            Add User
          </button>
          
          <button class="btn-secondary" (click)="refreshUsers()">
            <i class="fas fa-sync mr-2" [class.fa-spin]="isLoading"></i>
            Refresh
          </button>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div class="glass-card rounded-xl p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-slate-600 mb-1">Total Users</p>
              <p class="text-2xl font-bold text-slate-800">{{ users.length }}</p>
            </div>
            <div class="w-10 h-10 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
              <i class="fas fa-users text-white"></i>
            </div>
          </div>
        </div>

        <div class="glass-card rounded-xl p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-slate-600 mb-1">Active Users</p>
              <p class="text-2xl font-bold text-slate-800">{{ getActiveUsersCount() }}</p>
            </div>
            <div class="w-10 h-10 bg-gradient-to-r from-success-500 to-success-600 rounded-lg flex items-center justify-center">
              <i class="fas fa-user-check text-white"></i>
            </div>
          </div>
        </div>

        <div class="glass-card rounded-xl p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-slate-600 mb-1">Admins</p>
              <p class="text-2xl font-bold text-slate-800">{{ getAdminUsersCount() }}</p>
            </div>
            <div class="w-10 h-10 bg-gradient-to-r from-warning-500 to-warning-600 rounded-lg flex items-center justify-center">
              <i class="fas fa-user-shield text-white"></i>
            </div>
          </div>
        </div>

        <div class="glass-card rounded-xl p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-slate-600 mb-1">New This Month</p>
              <p class="text-2xl font-bold text-slate-800">{{ getNewUsersCount() }}</p>
            </div>
            <div class="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <i class="fas fa-user-plus text-white"></i>
            </div>
          </div>
        </div>
      </div>

      <!-- Users Table -->
      <div class="glass-card rounded-xl p-6">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-semibold text-slate-800">Users</h2>
          
          <!-- Search and Filter -->
          <div class="flex items-center space-x-4">
            <div class="relative">
              <input 
                type="text" 
                [(ngModel)]="searchTerm"
                (ngModelChange)="filterUsers()"
                placeholder="Search users..."
                class="input-field text-sm pl-10 pr-4 py-2 w-64">
              <i class="fas fa-search absolute left-3 top-3 text-slate-400"></i>
            </div>
            
            <select 
              [(ngModel)]="selectedRole"
              (ngModelChange)="filterUsers()"
              class="select-field text-sm">
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="moderator">Moderator</option>
              <option value="user">User</option>
            </select>
            
            <select 
              [(ngModel)]="selectedStatus"
              (ngModelChange)="filterUsers()"
              class="select-field text-sm">
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>

        <!-- Users Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6" *ngIf="filteredUsers.length > 0">
          <div 
            *ngFor="let user of filteredUsers; trackBy: trackByUserId" 
            class="border border-slate-200 rounded-lg p-4 hover:shadow-lg transition-all duration-200 bg-white/50">
            
            <div class="flex items-start justify-between mb-4">
              <div class="flex items-center space-x-3">
                <!-- Avatar -->
                <div class="w-12 h-12 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
                  <span class="text-white font-semibold text-lg">
                    {{ getInitials(user.firstName, user.lastName) }}
                  </span>
                </div>
                
                <div>
                  <h3 class="font-semibold text-slate-800">{{ user.firstName }} {{ user.lastName }}</h3>
                  <p class="text-sm text-slate-600">{{ user.username }}</p>
                </div>
              </div>
              
              <!-- Status Badge -->
              <span [class]="getStatusClass(user.status)" class="px-2 py-1 rounded text-xs font-medium">
                {{ user.status.toUpperCase() }}
              </span>
            </div>
            
            <div class="space-y-2 mb-4">
              <div class="flex items-center text-sm text-slate-600">
                <i class="fas fa-envelope mr-2 w-4"></i>
                {{ user.email }}
              </div>
              
              <div class="flex items-center text-sm text-slate-600">
                <i class="fas fa-user-tag mr-2 w-4"></i>
                {{ user.role }}
              </div>
              
              <div class="flex items-center text-sm text-slate-600">
                <i class="fas fa-calendar mr-2 w-4"></i>
                Joined {{ formatDate(user.createdAt) }}
              </div>
              
              <div *ngIf="user.lastLoginAt" class="flex items-center text-sm text-slate-600">
                <i class="fas fa-clock mr-2 w-4"></i>
                Last login {{ formatDate(user.lastLoginAt) }}
              </div>
            </div>
            
            <div *ngIf="user.bio" class="mb-4">
              <p class="text-sm text-slate-700">{{ user.bio }}</p>
            </div>
            
            <!-- Action Buttons -->
            <div class="flex items-center justify-between pt-4 border-t border-slate-200">
              <button 
                (click)="viewUserMessages(user.id)"
                class="text-primary-600 hover:text-primary-700 text-sm font-medium">
                <i class="fas fa-envelope mr-1"></i>
                Messages
              </button>
              
              <div class="flex items-center space-x-2">
                <button 
                  (click)="editUser(user)"
                  class="text-slate-600 hover:text-slate-800 p-2">
                  <i class="fas fa-edit"></i>
                </button>
                
                <button 
                  (click)="deleteUser(user.id)"
                  class="text-danger-600 hover:text-danger-800 p-2">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div *ngIf="filteredUsers.length === 0" class="text-center py-12">
          <i class="fas fa-users text-slate-400 text-4xl mb-4"></i>
          <h3 class="text-lg font-medium text-slate-600 mb-2">No users found</h3>
          <p class="text-slate-500 mb-4">
            {{ searchTerm || selectedRole !== 'all' || selectedStatus !== 'all' ? 'No users match your current filters' : 'No users have been created yet' }}
          </p>
          <button 
            *ngIf="searchTerm || selectedRole !== 'all' || selectedStatus !== 'all'"
            (click)="clearFilters()"
            class="btn-secondary">
            Clear Filters
          </button>
        </div>
      </div>

      <!-- Create User Modal -->
      <div 
        *ngIf="showCreateUserModal" 
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        (click)="closeCreateUserModal()">
        
        <div 
          class="glass-card rounded-xl p-6 max-w-md w-full"
          (click)="$event.stopPropagation()">
          
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-xl font-semibold text-slate-800">Create New User</h3>
            <button 
              (click)="closeCreateUserModal()"
              class="text-slate-400 hover:text-slate-600">
              <i class="fas fa-times"></i>
            </button>
          </div>
          
          <form (ngSubmit)="createUser()" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-2">First Name</label>
                <input 
                  type="text" 
                  [(ngModel)]="newUser.firstName"
                  name="firstName"
                  class="input-field"
                  required>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-2">Last Name</label>
                <input 
                  type="text" 
                  [(ngModel)]="newUser.lastName"
                  name="lastName"
                  class="input-field"
                  required>
              </div>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-2">Username</label>
              <input 
                type="text" 
                [(ngModel)]="newUser.username"
                name="username"
                class="input-field"
                required>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-2">Email</label>
              <input 
                type="email" 
                [(ngModel)]="newUser.email"
                name="email"
                class="input-field"
                required>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-2">Role</label>
              <select 
                [(ngModel)]="newUser.role"
                name="role"
                class="select-field">
                <option value="user">User</option>
                <option value="moderator">Moderator</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-2">Bio (Optional)</label>
              <textarea 
                [(ngModel)]="newUser.bio"
                name="bio"
                rows="3"
                class="input-field"
                placeholder="Tell us about this user..."></textarea>
            </div>
            
            <div class="flex justify-end space-x-4 pt-4">
              <button 
                type="button"
                (click)="closeCreateUserModal()"
                class="btn-secondary">
                Cancel
              </button>
              <button 
                type="submit" 
                class="btn-primary"
                [disabled]="isCreating">
                <i class="fas fa-plus mr-2" [class.fa-spin]="isCreating"></i>
                {{ isCreating ? 'Creating...' : 'Create User' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- User Messages Modal -->
      <div 
        *ngIf="selectedUserMessages" 
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        (click)="closeUserMessages()">
        
        <div 
          class="glass-card rounded-xl p-6 max-w-4xl w-full max-h-96 overflow-y-auto"
          (click)="$event.stopPropagation()">
          
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-xl font-semibold text-slate-800">User Messages</h3>
            <button 
              (click)="closeUserMessages()"
              class="text-slate-400 hover:text-slate-600">
              <i class="fas fa-times"></i>
            </button>
          </div>
          
          <div class="space-y-4" *ngIf="selectedUserMessages.length > 0">
            <div 
              *ngFor="let message of selectedUserMessages" 
              class="border border-slate-200 rounded-lg p-4 bg-white/50">
              <div class="flex items-center justify-between mb-2">
                <span [class]="getPriorityClass(message.priority)" class="px-2 py-1 rounded text-xs font-medium">
                  {{ message.priority.toUpperCase() }}
                </span>
                <span class="text-sm text-slate-500">{{ formatDate(message.timestamp) }}</span>
              </div>
              <p class="text-slate-800">{{ message.content }}</p>
              <div class="mt-2">
                <span [class]="getStatusClass(message.status)" class="px-2 py-1 rounded text-xs font-medium">
                  {{ message.status.toUpperCase() }}
                </span>
              </div>
            </div>
          </div>
          
          <div *ngIf="selectedUserMessages.length === 0" class="text-center py-8">
            <i class="fas fa-envelope text-slate-400 text-3xl mb-2"></i>
            <p class="text-slate-500">No messages found for this user</p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class UserManagementComponent implements OnInit, OnDestroy {
  users: UserData[] = [];
  filteredUsers: UserData[] = [];
  searchTerm = '';
  selectedRole = 'all';
  selectedStatus = 'all';
  isLoading = false;
  isCreating = false;
  
  showCreateUserModal = false;
  selectedUserMessages: any[] | null = null;
  
  newUser = {
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    role: 'user',
    bio: ''
  };
  
  private subscriptions: Subscription[] = [];

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadUsers();
    
    // Auto-refresh every 30 seconds
    const refreshInterval = interval(30000).subscribe(() => {
      this.loadUsers();
    });
    
    this.subscriptions.push(refreshInterval);
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadUsers() {
    this.isLoading = true;
    this.apiService.getUsers().subscribe({
      next: (response) => {
        if (response.success) {
          this.users = response.data || [];
          this.filterUsers();
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.isLoading = false;
      }
    });
  }

  filterUsers() {
    this.filteredUsers = this.users.filter(user => {
      const matchesSearch = !this.searchTerm || 
        user.firstName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        user.lastName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        user.username.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      const matchesRole = this.selectedRole === 'all' || user.role === this.selectedRole;
      const matchesStatus = this.selectedStatus === 'all' || user.status === this.selectedStatus;
      
      return matchesSearch && matchesRole && matchesStatus;
    });
  }

  clearFilters() {
    this.searchTerm = '';
    this.selectedRole = 'all';
    this.selectedStatus = 'all';
    this.filterUsers();
  }

  refreshUsers() {
    this.loadUsers();
  }

  createUser() {
    if (!this.newUser.firstName || !this.newUser.lastName || !this.newUser.username || !this.newUser.email) {
      return;
    }
    
    this.isCreating = true;
    
    this.apiService.createUser(this.newUser).subscribe({
      next: (response) => {
        console.log('User created:', response);
        this.closeCreateUserModal();
        this.loadUsers();
        this.isCreating = false;
      },
      error: (error) => {
        console.error('Error creating user:', error);
        this.isCreating = false;
      }
    });
  }

  editUser(user: UserData) {
    // Implement edit functionality
    console.log('Edit user:', user);
  }

  deleteUser(userId: string) {
    if (confirm('Are you sure you want to delete this user?')) {
      // Implement delete functionality
      console.log('Delete user:', userId);
    }
  }

  viewUserMessages(userId: string) {
    this.apiService.getUserMessages(userId).subscribe({
      next: (response) => {
        if (response.success) {
          this.selectedUserMessages = response.data || [];
        }
      },
      error: (error) => console.error('Error loading user messages:', error)
    });
  }

  closeCreateUserModal() {
    this.showCreateUserModal = false;
    this.newUser = {
      firstName: '',
      lastName: '',
      username: '',
      email: '',
      role: 'user',
      bio: ''
    };
  }

  closeUserMessages() {
    this.selectedUserMessages = null;
  }

  // Helper methods
  getActiveUsersCount(): number {
    return this.users.filter(user => user.status === 'active').length;
  }

  getAdminUsersCount(): number {
    return this.users.filter(user => user.role === 'admin').length;
  }

  getNewUsersCount(): number {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    return this.users.filter(user => new Date(user.createdAt) > oneMonthAgo).length;
  }

  getInitials(firstName: string, lastName: string): string {
    return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
  }

  getStatusClass(status: string): string {
    const classes = {
      active: 'bg-success-100 text-success-800',
      inactive: 'bg-slate-100 text-slate-800',
      suspended: 'bg-danger-100 text-danger-800'
    };
    return classes[status as keyof typeof classes] || classes.inactive;
  }

  getPriorityClass(priority: string): string {
    const classes = {
      urgent: 'bg-red-100 text-red-800',
      high: 'bg-orange-100 text-orange-800',
      normal: 'bg-blue-100 text-blue-800',
      low: 'bg-gray-100 text-gray-800'
    };
    return classes[priority as keyof typeof classes] || classes.normal;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  }

  trackByUserId(index: number, user: UserData): string {
    return user.id;
  }
}