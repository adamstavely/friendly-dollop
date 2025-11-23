import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { AISecurityService } from '../../services/ai-security.service';
import { SecurityRule } from '../../../../shared/models/security.model';

@Component({
  selector: 'app-security-rules',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatTableModule, MatSlideToggleModule],
  template: `
    <div class="rules-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Security Rules</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <table mat-table [dataSource]="rules">
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Name</th>
              <td mat-cell *matCellDef="let rule">{{ rule.name }}</td>
            </ng-container>
            <ng-container matColumnDef="type">
              <th mat-header-cell *matHeaderCellDef>Type</th>
              <td mat-cell *matCellDef="let rule">{{ rule.type }}</td>
            </ng-container>
            <ng-container matColumnDef="enabled">
              <th mat-header-cell *matHeaderCellDef>Enabled</th>
              <td mat-cell *matCellDef="let rule">
                <mat-slide-toggle [(ngModel)]="rule.enabled" (change)="updateRule(rule)"></mat-slide-toggle>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="['name', 'type', 'enabled']"></tr>
            <tr mat-row *matRowDef="let row; columns: ['name', 'type', 'enabled']"></tr>
          </table>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`.rules-container { padding: 20px; }`]
})
export class SecurityRulesComponent implements OnInit {
  rules: SecurityRule[] = [];

  constructor(private securityService: AISecurityService) {}

  ngOnInit(): void {
    this.loadRules();
  }

  loadRules(): void {
    this.securityService.getSecurityRules().subscribe({
      next: (rules) => {
        this.rules = rules;
      }
    });
  }

  updateRule(rule: SecurityRule): void {
    this.securityService.updateSecurityRule(rule.id, { enabled: rule.enabled }).subscribe({
      error: (err) => {
        console.error('Error updating rule:', err);
        // Revert on error
        rule.enabled = !rule.enabled;
      }
    });
  }
}

