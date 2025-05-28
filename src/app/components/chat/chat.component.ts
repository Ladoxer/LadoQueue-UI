import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="glass-card rounded-xl p-6">
      <h2 class="text-2xl font-bold text-slate-800 mb-4">Chat System</h2>
      <p class="text-slate-600">Real-time chat functionality coming soon...</p>
    </div>
  `
})
export class ChatComponent {}