import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="glass-card rounded-xl p-6">
      <h2 class="text-2xl font-bold text-slate-800 mb-4">Analytics Dashboard</h2>
      <p class="text-slate-600">Advanced analytics and reporting coming soon...</p>
    </div>
  `
})
export class AnalyticsComponent {}