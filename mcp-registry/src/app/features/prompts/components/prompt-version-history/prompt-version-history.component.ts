import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { PromptService } from '../../services/prompt.service';
import { PromptVersion } from '../../../../shared/models/prompt.model';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-prompt-version-history',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatTableModule, LoadingSpinnerComponent],
  template: `
    <div class="version-history-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Version History</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <app-loading-spinner *ngIf="loading"></app-loading-spinner>
          <table mat-table [dataSource]="versions" *ngIf="!loading">
            <ng-container matColumnDef="version">
              <th mat-header-cell *matHeaderCellDef>Version</th>
              <td mat-cell *matCellDef="let v">{{ v.version }}</td>
            </ng-container>
            <ng-container matColumnDef="createdAt">
              <th mat-header-cell *matHeaderCellDef>Created</th>
              <td mat-cell *matCellDef="let v">{{ v.createdAt | date:'short' }}</td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="['version', 'createdAt']"></tr>
            <tr mat-row *matRowDef="let row; columns: ['version', 'createdAt']"></tr>
          </table>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`.version-history-container { padding: 20px; }`]
})
export class PromptVersionHistoryComponent implements OnInit {
  versions: PromptVersion[] = [];
  loading = false;

  constructor(
    private route: ActivatedRoute,
    private promptService: PromptService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadVersions(id);
    }
  }

  loadVersions(id: string): void {
    this.loading = true;
    this.promptService.getPromptVersions(id).subscribe({
      next: (versions) => {
        this.versions = versions;
        this.loading = false;
      }
    });
  }
}

