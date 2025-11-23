import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { ToolService } from '../../services/tool.service';
import { Tool } from '../../../../shared/models/tool.model';

@Component({
  selector: 'app-tool-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatChipsModule,
    MatIconModule
  ],
  template: `
    <div class="tool-form-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>{{ isEditMode ? 'Edit Tool' : 'Create New Tool' }}</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="toolForm" (ngSubmit)="onSubmit()">
            <mat-form-field>
              <mat-label>Name</mat-label>
              <input matInput formControlName="name" required>
            </mat-form-field>

            <mat-form-field>
              <mat-label>Description</mat-label>
              <textarea matInput formControlName="description" rows="4"></textarea>
            </mat-form-field>

            <mat-form-field>
              <mat-label>Domain</mat-label>
              <mat-select formControlName="domain" required>
                <mat-option value="search">Search</mat-option>
                <mat-option value="finance">Finance</mat-option>
                <mat-option value="hr">HR</mat-option>
                <mat-option value="platform">Platform</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field>
              <mat-label>Security Class</mat-label>
              <mat-select formControlName="securityClass" required>
                <mat-option value="public">Public</mat-option>
                <mat-option value="internal">Internal</mat-option>
                <mat-option value="restricted">Restricted</mat-option>
                <mat-option value="highly-restricted">Highly Restricted</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field>
              <mat-label>Lifecycle State</mat-label>
              <mat-select formControlName="lifecycleState">
                <mat-option value="development">Development</mat-option>
                <mat-option value="staging">Staging</mat-option>
                <mat-option value="pilot">Pilot</mat-option>
                <mat-option value="production">Production</mat-option>
                <mat-option value="deprecated">Deprecated</mat-option>
                <mat-option value="retired">Retired</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field>
              <mat-label>Owner Team</mat-label>
              <input matInput formControlName="ownerTeam" required>
            </mat-form-field>

            <mat-form-field>
              <mat-label>Contact</mat-label>
              <input matInput formControlName="contact" type="email" required>
            </mat-form-field>

            <div class="form-actions">
              <button mat-raised-button type="button" (click)="onCancel()">Cancel</button>
              <button mat-raised-button color="primary" type="submit" [disabled]="toolForm.invalid">
                {{ isEditMode ? 'Update' : 'Create' }}
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .tool-form-container {
      padding: 20px;
    }
    form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .form-actions {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
      margin-top: 20px;
    }
  `]
})
export class ToolFormComponent implements OnInit {
  toolForm: FormGroup;
  isEditMode = false;
  toolId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private toolService: ToolService
  ) {
    this.toolForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      domain: ['', Validators.required],
      securityClass: ['internal', Validators.required],
      lifecycleState: ['development'],
      ownerTeam: ['', Validators.required],
      contact: ['', [Validators.required, Validators.email]],
      capabilities: [[]],
      tags: [[]]
    });
  }

  ngOnInit(): void {
    this.toolId = this.route.snapshot.paramMap.get('id');
    if (this.toolId) {
      this.isEditMode = true;
      this.loadTool();
    }
  }

  loadTool(): void {
    if (!this.toolId) return;
    this.toolService.getToolById(this.toolId).subscribe({
      next: (tool) => {
        this.toolForm.patchValue(tool);
      },
      error: (err) => {
        console.error('Error loading tool:', err);
      }
    });
  }

  onSubmit(): void {
    if (this.toolForm.valid) {
      const toolData = this.toolForm.value;
      if (this.isEditMode && this.toolId) {
        this.toolService.updateTool(this.toolId, toolData).subscribe({
          next: () => {
            this.router.navigate(['/tools', this.toolId]);
          },
          error: (err) => {
            console.error('Error updating tool:', err);
          }
        });
      } else {
        this.toolService.createTool(toolData).subscribe({
          next: (tool) => {
            this.router.navigate(['/tools', tool.toolId]);
          },
          error: (err) => {
            console.error('Error creating tool:', err);
          }
        });
      }
    }
  }

  onCancel(): void {
    if (this.toolId) {
      this.router.navigate(['/tools', this.toolId]);
    } else {
      this.router.navigate(['/tools']);
    }
  }
}

