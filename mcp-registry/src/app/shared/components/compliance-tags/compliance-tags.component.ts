import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatChipsModule } from '@angular/material/chips';

@Component({
  selector: 'app-compliance-tags',
  standalone: true,
  imports: [CommonModule, MatChipsModule],
  template: `
    <div class="compliance-tags">
      <mat-chip *ngFor="let tag of tags" [class]="getTagClass(tag)">
        {{ tag }}
      </mat-chip>
    </div>
  `,
  styles: [`
    .compliance-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    mat-chip {
      border-radius: 8px;
      font-weight: 500;
      font-size: 11px;
      padding: 4px 10px;
      border: none;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .pii, .phi, .hipaa, .pci {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      color: white;
      box-shadow: 0 2px 4px rgba(239, 68, 68, 0.2);
    }
    .internal-only {
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      color: white;
      box-shadow: 0 2px 4px rgba(245, 158, 11, 0.2);
    }
  `]
})
export class ComplianceTagsComponent {
  @Input() tags: string[] = [];

  getTagClass(tag: string): string {
    return tag.toLowerCase().replace(/_/g, '-');
  }
}

