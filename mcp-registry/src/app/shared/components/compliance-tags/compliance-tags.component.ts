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
      gap: 4px;
    }
    .pii, .phi, .hipaa, .pci {
      background-color: #f44336;
      color: white;
      font-size: 11px;
    }
    .internal-only {
      background-color: #ff9800;
      color: white;
      font-size: 11px;
    }
  `]
})
export class ComplianceTagsComponent {
  @Input() tags: string[] = [];

  getTagClass(tag: string): string {
    return tag.toLowerCase().replace(/_/g, '-');
  }
}

