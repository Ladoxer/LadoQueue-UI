import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ApiService,
  ChatChannel,
  ChatMessage,
} from '../../services/api.service';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div
      class="h-[calc(100vh-12rem)] flex bg-white/30 backdrop-blur-sm rounded-xl border border-white/20 shadow-glass overflow-hidden"
    >
      <!-- Sidebar -->
      <div class="w-80 border-r border-slate-200 flex flex-col bg-white/50">
        <!-- Sidebar Header -->
        <div class="p-4 border-b border-slate-200">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-slate-800">Channels</h2>
            <button
              (click)="showCreateChannelModal = true"
              class="btn-primary text-sm px-3 py-1"
            >
              <i class="fas fa-plus mr-1"></i>
              New
            </button>
          </div>

          <!-- Search Channels -->
          <div class="relative">
            <input
              type="text"
              [(ngModel)]="channelSearchTerm"
              (ngModelChange)="filterChannels()"
              placeholder="Search channels..."
              class="input-field text-sm pl-8 pr-4 py-2"
            />
            <i
              class="fas fa-search absolute left-2 top-3 text-slate-400 text-sm"
            ></i>
          </div>
        </div>

        <!-- Channels List -->
        <div class="flex-1 overflow-y-auto">
          <div class="p-2">
            <div
              *ngFor="
                let channel of filteredChannels;
                trackBy: trackByChannelId
              "
              (click)="selectChannel(channel)"
              [class]="getChannelClass(channel.id)"
              class="flex items-center p-3 rounded-lg cursor-pointer transition-all duration-200 mb-1"
            >
              <div class="flex-1">
                <div class="flex items-center space-x-2">
                  <i
                    [class]="
                      channel.isPrivate ? 'fas fa-lock' : 'fas fa-hashtag'
                    "
                    class="text-slate-500 text-sm"
                  ></i>
                  <span class="font-medium text-slate-800 truncate">{{
                    channel.name
                  }}</span>
                </div>

                <div class="flex items-center justify-between mt-1">
                  <p class="text-xs text-slate-500 truncate">
                    {{ channel.description || 'No description' }}
                  </p>
                  <div class="flex items-center space-x-2">
                    <span class="text-xs text-slate-400">{{
                      channel.memberCount
                    }}</span>
                    <i class="fas fa-users text-slate-400 text-xs"></i>
                  </div>
                </div>
              </div>

              <!-- Unread indicator -->
              <div
                *ngIf="getUnreadCount(channel.id) > 0"
                class="w-2 h-2 bg-primary-500 rounded-full ml-2 animate-pulse"
              ></div>
            </div>
          </div>

          <!-- Online Users -->
          <div class="p-4 border-t border-slate-200">
            <h3 class="text-sm font-semibold text-slate-600 mb-3">
              Online Users ({{ onlineUsers.length }})
            </h3>
            <div class="space-y-2">
              <div
                *ngFor="let user of onlineUsers.slice(0, 10)"
                class="flex items-center space-x-2"
              >
                <div
                  class="w-6 h-6 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full flex items-center justify-center"
                >
                  <span class="text-white text-xs font-medium">{{
                    getInitials(user.username)
                  }}</span>
                </div>
                <span class="text-sm text-slate-700 truncate">{{
                  user.username
                }}</span>
                <div class="w-2 h-2 bg-success-500 rounded-full ml-auto"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Chat Area -->
      <div class="flex-1 flex flex-col">
        <!-- Chat Header -->
        <div
          *ngIf="selectedChannel"
          class="p-4 border-b border-slate-200 bg-white/80"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <i
                [class]="
                  selectedChannel.isPrivate ? 'fas fa-lock' : 'fas fa-hashtag'
                "
                class="text-slate-500"
              ></i>
              <div>
                <h3 class="font-semibold text-slate-800">
                  {{ selectedChannel.name }}
                </h3>
                <p class="text-sm text-slate-500">
                  {{ selectedChannel.memberCount }} members
                </p>
              </div>
            </div>

            <div class="flex items-center space-x-2">
              <button
                class="btn-secondary text-sm px-3 py-1"
                (click)="loadChannelMessages()"
              >
                <i
                  class="fas fa-sync mr-1"
                  [class.fa-spin]="isLoadingMessages"
                ></i>
                Refresh
              </button>

              <button class="text-slate-500 hover:text-slate-700 p-2">
                <i class="fas fa-info-circle"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- Messages Area -->
        <div
          *ngIf="selectedChannel"
          #messagesContainer
          class="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-white/30 to-white/10"
        >
          <div
            *ngFor="let message of messages; trackBy: trackByMessageId"
            class="flex space-x-3 hover:bg-white/20 rounded-lg p-2 transition-colors duration-200"
          >
            <!-- Avatar -->
            <div
              class="w-8 h-8 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full flex items-center justify-center flex-shrink-0"
            >
              <span class="text-white text-sm font-medium">{{
                getInitials(message.username)
              }}</span>
            </div>

            <!-- Message Content -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center space-x-2 mb-1">
                <span class="font-medium text-slate-800">{{
                  message.username
                }}</span>
                <span class="text-xs text-slate-500">{{
                  formatMessageTime(message.timestamp)
                }}</span>
              </div>

              <div class="text-slate-700 break-words">
                <p [innerHTML]="formatMessage(message.message)"></p>

                <!-- Reply indicator -->
                <div
                  *ngIf="message.replyTo"
                  class="mt-2 pl-3 border-l-2 border-slate-300 text-sm text-slate-600"
                >
                  <i class="fas fa-reply mr-1"></i>
                  Replying to a message
                </div>

                <!-- Mentions -->
                <div
                  *ngIf="message.mentions && message.mentions.length > 0"
                  class="mt-2 flex flex-wrap gap-1"
                >
                  <span
                    *ngFor="let mention of message.mentions"
                    class="bg-primary-100 text-primary-800 px-2 py-1 rounded text-xs"
                  >
                    &#64;{{ mention }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Loading messages indicator -->
          <div *ngIf="isLoadingMessages" class="text-center py-4">
            <i class="fas fa-spinner fa-spin text-slate-400"></i>
            <p class="text-slate-500 text-sm mt-2">Loading messages...</p>
          </div>

          <!-- Empty state -->
          <div
            *ngIf="messages.length === 0 && !isLoadingMessages"
            class="text-center py-8"
          >
            <i class="fas fa-comments text-slate-400 text-4xl mb-4"></i>
            <h3 class="text-lg font-medium text-slate-600 mb-2">
              No messages yet
            </h3>
            <p class="text-slate-500">
              Be the first to send a message in this channel!
            </p>
          </div>
        </div>

        <!-- Message Input -->
        <div
          *ngIf="selectedChannel"
          class="p-4 border-t border-slate-200 bg-white/80"
        >
          <form (ngSubmit)="sendMessage()" class="flex items-end space-x-4">
            <div class="flex-1">
              <textarea
                [(ngModel)]="newMessage"
                name="message"
                #messageInput
                (keydown.enter)="handleEnterKey($event)"
                placeholder="Type your message..."
                rows="1"
                class="input-field resize-none"
                [disabled]="isSending"
              ></textarea>
            </div>

            <div class="flex items-center space-x-2">
              <button
                type="button"
                class="text-slate-500 hover:text-slate-700 p-2"
                title="Add emoji"
              >
                <i class="fas fa-smile"></i>
              </button>

              <button
                type="submit"
                [disabled]="!newMessage.trim() || isSending"
                class="btn-primary px-4 py-2"
              >
                <i class="fas fa-paper-plane" [class.fa-spin]="isSending"></i>
              </button>
            </div>
          </form>
        </div>

        <!-- No channel selected -->
        <div
          *ngIf="!selectedChannel"
          class="flex-1 flex items-center justify-center bg-gradient-to-b from-white/30 to-white/10"
        >
          <div class="text-center">
            <i class="fas fa-comments text-slate-400 text-6xl mb-4"></i>
            <h3 class="text-xl font-medium text-slate-600 mb-2">
              Welcome to Chat
            </h3>
            <p class="text-slate-500 mb-4">
              Select a channel to start messaging
            </p>
            <button (click)="showCreateChannelModal = true" class="btn-primary">
              <i class="fas fa-plus mr-2"></i>
              Create First Channel
            </button>
          </div>
        </div>
      </div>

      <!-- Create Channel Modal -->
      <div
        *ngIf="showCreateChannelModal"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        (click)="closeCreateChannelModal()"
      >
        <div
          class="glass-card rounded-xl p-6 max-w-md w-full"
          (click)="$event.stopPropagation()"
        >
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-xl font-semibold text-slate-800">Create Channel</h3>
            <button
              (click)="closeCreateChannelModal()"
              class="text-slate-400 hover:text-slate-600"
            >
              <i class="fas fa-times"></i>
            </button>
          </div>

          <form (ngSubmit)="createChannel()" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-2"
                >Channel Name</label
              >
              <input
                type="text"
                [(ngModel)]="newChannel.name"
                name="name"
                placeholder="e.g. general, announcements"
                class="input-field"
                required
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 mb-2"
                >Description</label
              >
              <textarea
                [(ngModel)]="newChannel.description"
                name="description"
                rows="3"
                placeholder="What's this channel about?"
                class="input-field"
              ></textarea>
            </div>

            <div class="flex items-center space-x-3">
              <input
                type="checkbox"
                [(ngModel)]="newChannel.isPrivate"
                name="isPrivate"
                id="isPrivate"
                class="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              />
              <label for="isPrivate" class="text-sm text-slate-700">
                Make this channel private
              </label>
            </div>

            <div class="flex justify-end space-x-4 pt-4">
              <button
                type="button"
                (click)="closeCreateChannelModal()"
                class="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="btn-primary"
                [disabled]="isCreatingChannel || !newChannel.name.trim()"
              >
                <i
                  class="fas fa-plus mr-2"
                  [class.fa-spin]="isCreatingChannel"
                ></i>
                {{ isCreatingChannel ? 'Creating...' : 'Create Channel' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
})
export class ChatComponent implements OnInit, OnDestroy {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  @ViewChild('messageInput') messageInput!: ElementRef;

  channels: ChatChannel[] = [];
  filteredChannels: ChatChannel[] = [];
  selectedChannel: ChatChannel | null = null;
  messages: ChatMessage[] = [];
  onlineUsers: any[] = [];

  channelSearchTerm = '';
  newMessage = '';
  isSending = false;
  isLoadingMessages = false;
  isCreatingChannel = false;

  showCreateChannelModal = false;
  newChannel = {
    name: '',
    description: '',
    isPrivate: false,
  };

  // Mock current user - in real app, get from auth service
  currentUser = {
    id: 'user_1',
    username: 'currentuser',
  };

  private subscriptions: Subscription[] = [];
  private unreadCounts: { [channelId: string]: number } = {};

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadChannels();
    this.loadOnlineUsers();

    // Auto-refresh channels and messages
    const refreshInterval = interval(5000).subscribe(() => {
      if (this.selectedChannel) {
        this.loadChannelMessages(true); // Silent refresh
      }
      this.loadOnlineUsers();
    });

    this.subscriptions.push(refreshInterval);
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  loadChannels() {
    this.apiService.getChannels().subscribe({
      next: (response) => {
        if (response.success) {
          this.channels = response.data || [];
          this.filterChannels();

          // Auto-select first channel if none selected
          if (!this.selectedChannel && this.channels.length > 0) {
            this.selectChannel(this.channels[0]);
          }
        }
      },
      error: (error) => console.error('Error loading channels:', error),
    });
  }

  filterChannels() {
    this.filteredChannels = this.channels.filter(
      (channel) =>
        !this.channelSearchTerm ||
        channel.name
          .toLowerCase()
          .includes(this.channelSearchTerm.toLowerCase()) ||
        (channel.description &&
          channel.description
            .toLowerCase()
            .includes(this.channelSearchTerm.toLowerCase()))
    );
  }

  selectChannel(channel: ChatChannel) {
    this.selectedChannel = channel;
    this.loadChannelMessages();

    // Reset unread count
    this.unreadCounts[channel.id] = 0;
  }

  loadChannelMessages(silent: boolean = false) {
    if (!this.selectedChannel) return;

    if (!silent) {
      this.isLoadingMessages = true;
    }

    this.apiService.getChannelMessages(this.selectedChannel.id, 50).subscribe({
      next: (response) => {
        if (response.success) {
          this.messages = response.data || [];

          // Scroll to bottom after messages load
          setTimeout(() => {
            this.scrollToBottom();
          }, 100);
        }
        this.isLoadingMessages = false;
      },
      error: (error) => {
        console.error('Error loading messages:', error);
        this.isLoadingMessages = false;
      },
    });
  }

  sendMessage() {
    if (!this.newMessage.trim() || !this.selectedChannel || this.isSending) {
      return;
    }

    this.isSending = true;

    this.apiService
      .sendChatMessage(
        this.selectedChannel.id,
        this.currentUser.id,
        this.newMessage
      )
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.newMessage = '';
            this.loadChannelMessages(true);

            // Focus back to input
            setTimeout(() => {
              this.messageInput.nativeElement.focus();
            }, 100);
          }
          this.isSending = false;
        },
        error: (error) => {
          console.error('Error sending message:', error);
          this.isSending = false;
        },
      });
  }

  createChannel() {
    if (!this.newChannel.name.trim() || this.isCreatingChannel) {
      return;
    }

    this.isCreatingChannel = true;

    this.apiService
      .createChannel(this.currentUser.id, {
        name: this.newChannel.name,
        description: this.newChannel.description,
        isPrivate: this.newChannel.isPrivate,
      })
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.closeCreateChannelModal();
            this.loadChannels();
          }
          this.isCreatingChannel = false;
        },
        error: (error) => {
          console.error('Error creating channel:', error);
          this.isCreatingChannel = false;
        },
      });
  }

  loadOnlineUsers() {
    this.apiService.getOnlineUsers().subscribe({
      next: (response) => {
        if (response.success) {
          this.onlineUsers = response.data || [];
        }
      },
      error: (error) => console.error('Error loading online users:', error),
    });
  }

  handleEnterKey(event: Event) {
    const ke = event as KeyboardEvent;
    if (ke.key === 'Enter' && !ke.shiftKey) {
      ke.preventDefault();
      this.sendMessage();
    }
  }

  closeCreateChannelModal() {
    this.showCreateChannelModal = false;
    this.newChannel = {
      name: '',
      description: '',
      isPrivate: false,
    };
  }

  private scrollToBottom() {
    if (this.messagesContainer) {
      const element = this.messagesContainer.nativeElement;
      element.scrollTop = element.scrollHeight;
    }
  }

  // Helper methods
  getChannelClass(channelId: string): string {
    const baseClass = 'hover:bg-white/50';
    return this.selectedChannel?.id === channelId
      ? `${baseClass} bg-primary-100 border border-primary-200`
      : `${baseClass} hover:bg-slate-100`;
  }

  getUnreadCount(channelId: string): number {
    return this.unreadCounts[channelId] || 0;
  }

  getInitials(username: string): string {
    return username.substring(0, 2).toUpperCase();
  }

  formatMessage(message: string): string {
    // Basic message formatting - mentions, links, etc.
    return message
      .replace(
        /@(\w+)/g,
        '<span class="bg-primary-100 text-primary-800 px-1 rounded">@$1</span>'
      )
      .replace(
        /(https?:\/\/[^\s]+)/g,
        '<a href="$1" target="_blank" class="text-primary-600 hover:underline">$1</a>'
      );
  }

  formatMessageTime(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = diff / (1000 * 60 * 60);

    if (hours < 1) {
      const minutes = Math.floor(diff / (1000 * 60));
      return minutes <= 1 ? 'Just now' : `${minutes}m ago`;
    } else if (hours < 24) {
      return `${Math.floor(hours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  trackByChannelId(index: number, channel: ChatChannel): string {
    return channel.id;
  }

  trackByMessageId(index: number, message: ChatMessage): string {
    return message.id;
  }
}
