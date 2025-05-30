import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';

export interface MessageData {
  id: string;
  content: string;
  priority: 'urgent' | 'high' | 'normal' | 'low';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  timestamp: string;
  userId?: string;
  username?: string;
  retryCount?: number;
  processingStartTime?: string;
  completedTime?: string;
  error?: string;
}

export interface UserData {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
  createdAt: string;
  lastLoginAt?: string;
  bio?: string;
}

export interface ChatChannel {
  id: string;
  name: string;
  description?: string;
  isPrivate: boolean;
  createdBy: string;
  createdAt: string;
  memberCount: number;
  lastActivity: string;
}

export interface ChatMessage {
  id: string;
  type: string;
  channelId: string;
  channelName: string;
  userId: string;
  username: string;
  message: string;
  mentions?: string[];
  replyTo?: string;
  timestamp: string;
}

export interface QueueStats {
  totalMessages: number;
  pendingMessages: number;
  processingMessages: number;
  completedMessages: number;
  failedMessages: number;
  priorityBreakdown: {
    urgent: number;
    high: number;
    normal: number;
    low: number;
  };
  uniqueMessageIds: number;
}

export interface AnalyticsData {
  totalMessages: number;
  messagesLast24Hours: number;
  messagesLast7Days: number;
  peakHour: number;
  peakDay: string;
  averageMessagesPerHour: number;
  topUsers: any[];
  trendingTopics: any[];
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  // private baseUrl = 'http://localhost:3000';
  private baseUrl = 'hhttps://redis-ms1.onrender.com';
  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })
  };

  // Real-time data subjects
  private messagesSubject = new BehaviorSubject<MessageData[]>([]);
  private statsSubject = new BehaviorSubject<QueueStats | null>(null);
  private usersSubject = new BehaviorSubject<UserData[]>([]);
  private channelsSubject = new BehaviorSubject<ChatChannel[]>([]);

  public messages$ = this.messagesSubject.asObservable();
  public stats$ = this.statsSubject.asObservable();
  public users$ = this.usersSubject.asObservable();
  public channels$ = this.channelsSubject.asObservable();

  constructor(private http: HttpClient) {
    this.initializeData();
  }

  private initializeData() {
    // Load initial data
    this.getMessages().subscribe();
    this.getQueueStats().subscribe();
    this.getUsers().subscribe();
    this.getChannels().subscribe();
  }

  // Message Queue APIs
  createMessage(content: string, priority: string = 'normal', userId?: string): Observable<any> {
    const body = { content, priority, userId };
    return this.http.post(`${this.baseUrl}/messages`, body, this.httpOptions);
  }

  getMessages(): Observable<any> {
    return this.http.get(`${this.baseUrl}/messages`);
  }

  processNextMessage(): Observable<any> {
    return this.http.get(`${this.baseUrl}/messages/next`);
  }

  completeMessage(messageId: string, success: boolean = true): Observable<any> {
    return this.http.put(`${this.baseUrl}/messages/${messageId}/complete?success=${success}`, {});
  }

  retryMessage(messageId: string): Observable<any> {
    return this.http.put(`${this.baseUrl}/messages/${messageId}/retry`, {});
  }

  getQueueStats(): Observable<any> {
    return this.http.get(`${this.baseUrl}/messages/stats`);
  }

  // User Management APIs
  createUser(userData: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/users`, userData, this.httpOptions);
  }

  getUsers(): Observable<any> {
    return this.http.get(`${this.baseUrl}/users`);
  }

  getUserById(userId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/users/${userId}`);
  }

  updateUser(userId: string, userData: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/users/${userId}`, userData, this.httpOptions);
  }

  getUserMessages(userId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/users/${userId}/messages`);
  }

  // Chat APIs
  createChannel(creatorId: string, channelData: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/chat/channels?creatorId=${creatorId}`, channelData, this.httpOptions);
  }

  getChannels(): Observable<any> {
    return this.http.get(`${this.baseUrl}/chat/channels`);
  }

  getChannelMessages(channelId: string, limit: number = 50): Observable<any> {
    return this.http.get(`${this.baseUrl}/chat/channels/${channelId}/messages?limit=${limit}`);
  }

  sendChatMessage(channelId: string, senderId: string, message: string): Observable<any> {
    const body = { message };
    return this.http.post(`${this.baseUrl}/chat/channels/${channelId}/messages?senderId=${senderId}`, body, this.httpOptions);
  }

  setUserPresence(userId: string, status: string, currentChannel?: string): Observable<any> {
    const body = { status, currentChannel };
    return this.http.post(`${this.baseUrl}/chat/presence/${userId}`, body, this.httpOptions);
  }

  getOnlineUsers(): Observable<any> {
    return this.http.get(`${this.baseUrl}/chat/presence`);
  }

  // Analytics APIs
  getAnalytics(): Observable<any> {
    return this.http.get(`${this.baseUrl}/analytics/activity-metrics`);
  }

  getLeaderboards(): Observable<any> {
    return this.http.get(`${this.baseUrl}/analytics/leaderboards`);
  }

  getTrendingTopics(): Observable<any> {
    return this.http.get(`${this.baseUrl}/analytics/trending-topics`);
  }

  getDashboardData(): Observable<any> {
    return this.http.get(`${this.baseUrl}/analytics/dashboard`);
  }

  // Notification APIs
  broadcastNotification(alertLevel: string, message: string, details?: any): Observable<any> {
    const body = { alertLevel, message, details };
    return this.http.post(`${this.baseUrl}/notifications/system/broadcast`, body, this.httpOptions);
  }

  getNotificationHistory(userId?: string): Observable<any> {
    const url = userId 
      ? `${this.baseUrl}/notifications/user/${userId}/history`
      : `${this.baseUrl}/notifications/system/history`;
    return this.http.get(url);
  }

  // Update local state
  updateMessages(messages: MessageData[]) {
    this.messagesSubject.next(messages);
  }

  updateStats(stats: QueueStats) {
    this.statsSubject.next(stats);
  }

  updateUsers(users: UserData[]) {
    this.usersSubject.next(users);
  }

  updateChannels(channels: ChatChannel[]) {
    this.channelsSubject.next(channels);
  }

  // Refresh data
  refreshAll() {
    this.getMessages().subscribe(response => {
      if (response.success) {
        this.updateMessages(response.messages);
      }
    });

    this.getQueueStats().subscribe(response => {
      if (response.success) {
        this.updateStats(response.stats);
      }
    });

    this.getUsers().subscribe(response => {
      if (response.success) {
        this.updateUsers(response.data);
      }
    });

    this.getChannels().subscribe(response => {
      if (response.success) {
        this.updateChannels(response.data);
      }
    });
  }
}