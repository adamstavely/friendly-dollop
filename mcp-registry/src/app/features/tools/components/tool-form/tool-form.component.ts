import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ToastService } from '../../../../core/services/toast.service';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatExpansionModule } from '@angular/material/expansion';
import { ToolService } from '../../services/tool.service';
import { Tool } from '../../../../shared/models/tool.model';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { HelpTooltipComponent } from '../../../../shared/components/help-tooltip/help-tooltip.component';

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
    MatIconModule,
    MatAutocompleteModule,
    MatExpansionModule,
    HelpTooltipComponent
  ],
  template: `
    <div class="tool-form-container">
      <mat-card>
        <mat-card-header>
          <div class="header-content">
            <mat-card-title>{{ isEditMode ? 'Edit Tool' : 'Create New Tool' }}</mat-card-title>
            <app-help-tooltip context="tool-form" tooltip="Learn about creating tools"></app-help-tooltip>
          </div>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="toolForm" (ngSubmit)="onSubmit()">
            <mat-form-field>
              <mat-label>Name</mat-label>
              <input matInput formControlName="name" required>
              <mat-error *ngIf="toolForm.get('name')?.hasError('required') && toolForm.get('name')?.touched">
                Name is required
              </mat-error>
            </mat-form-field>

            <mat-form-field>
              <mat-label>Description</mat-label>
              <textarea matInput formControlName="description" rows="4"></textarea>
            </mat-form-field>

            <mat-form-field>
              <mat-label>Domain</mat-label>
              <mat-select formControlName="domain" required>
              <mat-error *ngIf="toolForm.get('domain')?.hasError('required') && toolForm.get('domain')?.touched">
                Domain is required
              </mat-error>
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
              <mat-error *ngIf="toolForm.get('securityClass')?.hasError('required') && toolForm.get('securityClass')?.touched">
                Security class is required
              </mat-error>
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
              <mat-error *ngIf="toolForm.get('ownerTeam')?.hasError('required') && toolForm.get('ownerTeam')?.touched">
                Owner team is required
              </mat-error>
            </mat-form-field>

            <mat-form-field>
              <mat-label>Contact</mat-label>
              <input matInput formControlName="contact" type="email" required>
              <mat-error *ngIf="toolForm.get('contact')?.hasError('required') && toolForm.get('contact')?.touched">
                Contact email is required
              </mat-error>
              <mat-error *ngIf="toolForm.get('contact')?.hasError('email') && toolForm.get('contact')?.touched">
                Please enter a valid email address
              </mat-error>
            </mat-form-field>

            <div class="chip-input-group">
              <mat-label>Capabilities</mat-label>
              <mat-chip-set>
                <mat-chip *ngFor="let capability of capabilities" (removed)="removeCapability(capability)">
                  {{ capability }}
                  <button matChipRemove>
                    <mat-icon>cancel</mat-icon>
                  </button>
                </mat-chip>
              </mat-chip-set>
              <input 
                placeholder="Add capability (press Enter)"
                #capabilityInput
                (keydown.enter)="addCapabilityFromInput(capabilityInput)"
                (blur)="addCapabilityFromInput(capabilityInput)">
            </div>

            <div class="chip-input-group">
              <mat-label>Tags</mat-label>
              <mat-chip-set>
                <mat-chip *ngFor="let tag of tags" (removed)="removeTag(tag)">
                  {{ tag }}
                  <button matChipRemove>
                    <mat-icon>cancel</mat-icon>
                  </button>
                </mat-chip>
              </mat-chip-set>
              <input 
                placeholder="Add tag (press Enter)"
                #tagInput
                (keydown.enter)="addTagFromInput(tagInput)"
                (blur)="addTagFromInput(tagInput)">
            </div>

            <mat-form-field>
              <mat-label>Compliance Tags</mat-label>
              <mat-select formControlName="complianceTags" multiple>
                <mat-option value="PII">PII</mat-option>
                <mat-option value="PHI">PHI</mat-option>
                <mat-option value="HIPAA">HIPAA</mat-option>
                <mat-option value="PCI">PCI</mat-option>
                <mat-option value="Internal-Only">Internal Only</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-expansion-panel>
              <mat-expansion-panel-header>
                <mat-panel-title>Rate Limits</mat-panel-title>
              </mat-expansion-panel-header>
              <div formGroupName="rateLimits">
                <mat-form-field>
                  <mat-label>Max Per Minute</mat-label>
                  <input matInput type="number" formControlName="maxPerMinute">
                </mat-form-field>
                <mat-form-field>
                  <mat-label>Max Concurrency</mat-label>
                  <input matInput type="number" formControlName="maxConcurrency">
                </mat-form-field>
                <mat-form-field>
                  <mat-label>Timeout (ms)</mat-label>
                  <input matInput type="number" formControlName="timeoutMs">
                </mat-form-field>
                <mat-form-field>
                  <mat-label>Retry Policy</mat-label>
                  <mat-select formControlName="retryPolicy">
                    <mat-option value="exponential">Exponential</mat-option>
                    <mat-option value="linear">Linear</mat-option>
                    <mat-option value="fixed">Fixed</mat-option>
                  </mat-select>
                </mat-form-field>
              </div>
            </mat-expansion-panel>

            <mat-expansion-panel>
              <mat-expansion-panel-header>
                <mat-panel-title>Dependencies</mat-panel-title>
              </mat-expansion-panel-header>
              <div formGroupName="dependencyGraph">
                <mat-form-field>
                  <mat-label>Depends On Tools</mat-label>
                  <mat-select formControlName="dependsOnTools" multiple>
                    <mat-option *ngFor="let tool of availableTools" [value]="tool.toolId">
                      {{ tool.name }}
                    </mat-option>
                  </mat-select>
                </mat-form-field>
              </div>
            </mat-expansion-panel>

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
    .chip-input-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 16px;
    }
    .chip-input-group mat-label {
      font-size: 12px;
      color: rgba(0, 0, 0, 0.6);
    }
    mat-chip-set {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
  `]
})
export class ToolFormComponent implements OnInit {
  toolForm: FormGroup;
  isEditMode = false;
  toolId: string | null = null;
  capabilities: string[] = [];
  tags: string[] = [];
  availableTools: Tool[] = [];
  separatorKeysCodes: number[] = [ENTER, COMMA];
  newCapability: string = '';
  newTag: string = '';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private toolService: ToolService,
    private toastService: ToastService
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
      tags: [[]],
      complianceTags: [[]],
      rateLimits: this.fb.group({
        maxPerMinute: [null],
        maxConcurrency: [null],
        timeoutMs: [null],
        retryPolicy: ['exponential']
      }),
      dependencyGraph: this.fb.group({
        dependsOnTools: [[]]
      })
    });
  }

  ngOnInit(): void {
    this.toolId = this.route.snapshot.paramMap.get('id');
    if (this.toolId) {
      this.isEditMode = true;
      this.loadTool();
    }
    this.loadAvailableTools();
  }

  loadAvailableTools(): void {
    this.toolService.getTools({ limit: 1000 }).subscribe({
      next: (response) => {
        this.availableTools = response.tools;
      },
      error: (err) => {
        console.error('Error loading tools:', err);
      }
    });
  }

  addCapabilityFromInput(input: HTMLInputElement): void {
    const value = (input.value || '').trim();
    if (value && !this.capabilities.includes(value)) {
      this.capabilities.push(value);
      this.toolForm.patchValue({ capabilities: this.capabilities });
      input.value = '';
    }
  }

  addCapability(event: any): void {
    // Legacy method for compatibility
    const value = (event.value || '').trim();
    if (value) {
      this.capabilities.push(value);
      this.toolForm.patchValue({ capabilities: this.capabilities });
    }
  }

  removeCapability(capability: string): void {
    const index = this.capabilities.indexOf(capability);
    if (index >= 0) {
      this.capabilities.splice(index, 1);
      this.toolForm.patchValue({ capabilities: this.capabilities });
    }
  }

  addTagFromInput(input: HTMLInputElement): void {
    const value = (input.value || '').trim();
    if (value && !this.tags.includes(value)) {
      this.tags.push(value);
      this.toolForm.patchValue({ tags: this.tags });
      input.value = '';
    }
  }

  addTag(event: any): void {
    // Legacy method for compatibility
    const value = (event.value || '').trim();
    if (value) {
      this.tags.push(value);
      this.toolForm.patchValue({ tags: this.tags });
    }
  }

  removeTag(tag: string): void {
    const index = this.tags.indexOf(tag);
    if (index >= 0) {
      this.tags.splice(index, 1);
      this.toolForm.patchValue({ tags: this.tags });
    }
  }

  loadTool(): void {
    if (!this.toolId) return;
    this.toolService.getToolById(this.toolId).subscribe({
      next: (tool) => {
        this.capabilities = tool.capabilities || [];
        this.tags = tool.tags || [];
        this.toolForm.patchValue({
          ...tool,
          capabilities: this.capabilities,
          tags: this.tags,
          complianceTags: tool.complianceTags || [],
          rateLimits: tool.rateLimits || {
            maxPerMinute: null,
            maxConcurrency: null,
            timeoutMs: null,
            retryPolicy: 'exponential'
          },
          dependencyGraph: {
            dependsOnTools: tool.dependencyGraph?.dependsOnTools || []
          }
        });
      },
      error: (err) => {
        console.error('Error loading tool:', err);
      }
    });
  }

  onSubmit(): void {
    if (this.toolForm.valid) {
      const toolData = {
        ...this.toolForm.value,
        capabilities: this.capabilities,
        tags: this.tags
      };
      if (this.isEditMode && this.toolId) {
        this.toolService.updateTool(this.toolId, toolData).subscribe({
          next: () => {
            this.toastService.success('Tool updated successfully');
            this.router.navigate(['/tools', this.toolId]);
          },
          error: (err) => {
            console.error('Error updating tool:', err);
            this.toastService.error(err.message || 'Failed to update tool');
          }
        });
      } else {
        this.toolService.createTool(toolData).subscribe({
          next: (tool) => {
            this.toastService.success('Tool created successfully');
            this.router.navigate(['/tools', tool.toolId]);
          },
          error: (err) => {
            console.error('Error creating tool:', err);
            this.toastService.error(err.message || 'Failed to create tool');
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

