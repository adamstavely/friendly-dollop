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
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { BundleService } from '../../services/bundle.service';
import { ToolService } from '../../../tools/services/tool.service';
import { Bundle } from '../../../../shared/models/bundle.model';
import { Tool } from '../../../../shared/models/tool.model';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-bundle-form',
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
    MatIconModule,
    MatAutocompleteModule,
    LoadingSpinnerComponent
  ],
  template: `
    <div class="bundle-form">
      <mat-card>
        <mat-card-header>
          <mat-card-title>{{ isEditMode ? 'Edit Bundle' : 'Create New Bundle' }}</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <app-loading-spinner *ngIf="loading" message="Loading..."></app-loading-spinner>

          <form [formGroup]="bundleForm" (ngSubmit)="onSubmit()" *ngIf="!loading">
            <mat-form-field>
              <mat-label>Name</mat-label>
              <input matInput formControlName="name" required>
            </mat-form-field>

            <mat-form-field>
              <mat-label>Description</mat-label>
              <textarea matInput formControlName="description" rows="4"></textarea>
            </mat-form-field>

            <mat-form-field>
              <mat-label>Version</mat-label>
              <input matInput formControlName="version" required>
            </mat-form-field>

            <mat-form-field>
              <mat-label>Owner Team</mat-label>
              <input matInput formControlName="ownerTeam" required>
            </mat-form-field>

            <mat-form-field>
              <mat-label>Tools</mat-label>
              <mat-select formControlName="toolIds" multiple>
                <mat-option *ngFor="let tool of availableTools" [value]="tool.toolId">
                  {{ tool.name }} ({{ tool.domain }})
                </mat-option>
              </mat-select>
            </mat-form-field>

            <div class="selected-tools">
              <h4>Selected Tools ({{ selectedToolIds.length }})</h4>
              <mat-chip-set>
                <mat-chip *ngFor="let toolId of selectedToolIds">
                  {{ getToolName(toolId) }}
                </mat-chip>
              </mat-chip-set>
            </div>

            <mat-form-field>
              <mat-label>Tags</mat-label>
              <input 
                placeholder="Add tag (press Enter)"
                #tagInput
                (keydown.enter)="addTagFromInput(tagInput)">
              <mat-chip-set>
                <mat-chip *ngFor="let tag of tags" (removed)="removeTag(tag)">
                  {{ tag }}
                  <button matChipRemove>
                    <mat-icon>cancel</mat-icon>
                  </button>
                </mat-chip>
              </mat-chip-set>
            </mat-form-field>

            <div class="form-actions">
              <button mat-raised-button type="button" (click)="onCancel()">Cancel</button>
              <button mat-raised-button color="primary" type="submit" [disabled]="bundleForm.invalid">
                {{ isEditMode ? 'Update' : 'Create' }}
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .bundle-form {
      padding: 20px;
    }
    form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .selected-tools {
      margin: 16px 0;
    }
    .selected-tools h4 {
      margin-bottom: 8px;
    }
    mat-chip-set {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .form-actions {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
      margin-top: 20px;
    }
  `]
})
export class BundleFormComponent implements OnInit {
  bundleForm: FormGroup;
  isEditMode = false;
  bundleId: string | null = null;
  availableTools: Tool[] = [];
  tags: string[] = [];
  loading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private bundleService: BundleService,
    private toolService: ToolService,
    private toastService: ToastService
  ) {
    this.bundleForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      version: ['1.0.0', Validators.required],
      ownerTeam: ['', Validators.required],
      toolIds: [[], Validators.required]
    });
  }

  ngOnInit(): void {
    this.bundleId = this.route.snapshot.paramMap.get('id');
    if (this.bundleId) {
      this.isEditMode = true;
      this.loadBundle();
    }
    this.loadAvailableTools();
  }

  loadAvailableTools(): void {
    this.toolService.getTools({ limit: 1000 }).subscribe({
      next: (response: any) => {
        this.availableTools = response.tools;
      },
      error: (err: any) => {
        console.error('Error loading tools:', err);
      }
    });
  }

  loadBundle(): void {
    if (!this.bundleId) return;
    this.loading = true;
    this.bundleService.getBundle(this.bundleId).subscribe({
      next: (bundle) => {
        this.tags = bundle.tags || [];
        this.bundleForm.patchValue({
          ...bundle,
          toolIds: bundle.toolIds || []
        });
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Error loading bundle:', err);
        this.loading = false;
      }
    });
  }

  get selectedToolIds(): string[] {
    return this.bundleForm.get('toolIds')?.value || [];
  }

  getToolName(toolId: string): string {
    const tool = this.availableTools.find(t => t.toolId === toolId);
    return tool ? tool.name : toolId;
  }

  addTagFromInput(input: HTMLInputElement): void {
    const value = (input.value || '').trim();
    if (value && !this.tags.includes(value)) {
      this.tags.push(value);
      input.value = '';
    }
  }

  removeTag(tag: string): void {
    const index = this.tags.indexOf(tag);
    if (index >= 0) {
      this.tags.splice(index, 1);
    }
  }

  onSubmit(): void {
    if (this.bundleForm.valid) {
      const bundleData = {
        ...this.bundleForm.value,
        tags: this.tags,
        active: true
      };
      
      if (this.isEditMode && this.bundleId) {
        this.bundleService.updateBundle(this.bundleId, bundleData).subscribe({
          next: () => {
            this.toastService.success('Bundle updated successfully');
            this.router.navigate(['/bundles', this.bundleId]);
          },
          error: (err: any) => {
            console.error('Error updating bundle:', err);
            this.toastService.error(err.message || 'Failed to update bundle');
          }
        });
      } else {
        this.bundleService.createBundle(bundleData).subscribe({
          next: (bundle) => {
            this.toastService.success('Bundle created successfully');
            this.router.navigate(['/bundles', bundle.bundleId]);
          },
          error: (err: any) => {
            console.error('Error creating bundle:', err);
            this.toastService.error(err.message || 'Failed to create bundle');
          }
        });
      }
    }
  }

  onCancel(): void {
    if (this.bundleId) {
      this.router.navigate(['/bundles', this.bundleId]);
    } else {
      this.router.navigate(['/bundles']);
    }
  }
}

