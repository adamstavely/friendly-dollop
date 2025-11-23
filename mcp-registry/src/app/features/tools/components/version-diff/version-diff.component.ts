import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { ToolVersion } from '../../../../shared/models/tool.model';

@Component({
  selector: 'app-version-diff',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatSelectModule,
    MatFormFieldModule,
    MatButtonModule
  ],
  template: `
    <div class="version-diff-container">
      <div class="version-selectors">
        <mat-form-field>
          <mat-label>Compare From</mat-label>
          <mat-select [(ngModel)]="fromVersion">
            <mat-option *ngFor="let version of versions" [value]="version.version">
              v{{ version.version }}
            </mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field>
          <mat-label>Compare To</mat-label>
          <mat-select [(ngModel)]="toVersion">
            <mat-option *ngFor="let version of versions" [value]="version.version">
              v{{ version.version }}
            </mat-option>
          </mat-select>
        </mat-form-field>
        <button mat-raised-button color="primary" (click)="compareVersions()">
          Compare
        </button>
      </div>

      <div *ngIf="diffResult" class="diff-result">
        <h4>Schema Changes</h4>
        <pre>{{ diffResult | json }}</pre>
        
        <div *ngIf="diffResult.breakingChanges && diffResult.breakingChanges.length > 0">
          <h4>Breaking Changes</h4>
          <ul>
            <li *ngFor="let change of diffResult.breakingChanges">{{ change }}</li>
          </ul>
        </div>

        <div *ngIf="diffResult.migrationNotes">
          <h4>Migration Notes</h4>
          <p>{{ diffResult.migrationNotes }}</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .version-diff-container {
      padding: 16px;
    }
    .version-selectors {
      display: flex;
      gap: 16px;
      align-items: flex-end;
      margin-bottom: 24px;
    }
    .version-selectors mat-form-field {
      flex: 1;
    }
    .diff-result {
      margin-top: 24px;
    }
    .diff-result pre {
      background: #f5f5f5;
      padding: 16px;
      border-radius: 4px;
      overflow-x: auto;
    }
    .diff-result h4 {
      margin-top: 16px;
      margin-bottom: 8px;
    }
  `]
})
export class VersionDiffComponent {
  @Input() versions: ToolVersion[] = [];
  fromVersion: string = '';
  toVersion: string = '';
  diffResult: any = null;

  ngOnInit(): void {
    if (this.versions.length >= 2) {
      this.fromVersion = this.versions[this.versions.length - 2].version;
      this.toVersion = this.versions[this.versions.length - 1].version;
    }
  }

  compareVersions(): void {
    if (!this.fromVersion || !this.toVersion) {
      return;
    }

    const from = this.versions.find(v => v.version === this.fromVersion);
    const to = this.versions.find(v => v.version === this.toVersion);

    if (!from || !to) {
      return;
    }

    // Simple diff logic - in production, use a proper diff library
    this.diffResult = {
      fromVersion: this.fromVersion,
      toVersion: this.toVersion,
      schemaChanges: this.diffSchemas(from.schema, to.schema),
      breakingChanges: to.deprecated ? ['Version is deprecated'] : [],
      migrationNotes: 'Review schema changes carefully before upgrading.'
    };
  }

  private diffSchemas(from: any, to: any): any {
    // Simplified diff - in production, use a proper JSON diff library
    return {
      added: this.getKeys(to).filter(k => !this.getKeys(from).includes(k)),
      removed: this.getKeys(from).filter(k => !this.getKeys(to).includes(k)),
      modified: this.getKeys(to).filter(k => 
        this.getKeys(from).includes(k) && JSON.stringify(from[k]) !== JSON.stringify(to[k])
      )
    };
  }

  private getKeys(obj: any): string[] {
    return obj ? Object.keys(obj) : [];
  }
}

