import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { ChangelogEntry } from '../../../../shared/models/tool.model';

@Component({
  selector: 'app-tool-changelog',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatExpansionModule],
  template: `
    <div class="changelog-container">
      <mat-expansion-panel *ngFor="let entry of changelog">
        <mat-expansion-panel-header>
          <mat-panel-title>
            Version {{ entry.version }}
          </mat-panel-title>
          <mat-panel-description>
            {{ entry.date }}
          </mat-panel-description>
        </mat-expansion-panel-header>
        <div>
          <h4>Changes</h4>
          <ul>
            <li *ngFor="let change of entry.changes">{{ change }}</li>
          </ul>
          <div *ngIf="entry.breakingChanges && entry.breakingChanges.length > 0">
            <h4>Breaking Changes</h4>
            <ul>
              <li *ngFor="let breaking of entry.breakingChanges">{{ breaking }}</li>
            </ul>
          </div>
          <div *ngIf="entry.migrationNotes">
            <h4>Migration Notes</h4>
            <p>{{ entry.migrationNotes }}</p>
          </div>
        </div>
      </mat-expansion-panel>
    </div>
  `,
  styles: [`
    .changelog-container {
      padding: 16px;
    }
  `]
})
export class ToolChangelogComponent {
  @Input() changelog: ChangelogEntry[] = [];
}

