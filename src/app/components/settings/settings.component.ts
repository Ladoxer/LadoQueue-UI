import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="glass-card rounded-xl p-6">
      <h2 class="text-2xl font-bold text-slate-800 mb-4">Settings</h2>
      <p class="text-slate-600">System configuration and settings coming soon...</p>
    </div>
  `
})
export class SettingsComponent {}