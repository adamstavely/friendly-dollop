import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';

export interface TemplateGeneratorData {
  onGenerate: (yaml: string) => void;
}

@Component({
  selector: 'app-yaml-template-generator',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatChipsModule,
    MatCheckboxModule,
    MatDividerModule
  ],
  template: `
    <h2 mat-dialog-title>Generate YAML Template</h2>
    <mat-dialog-content>
      <form [formGroup]="templateForm" class="template-form">
        <div class="form-section">
          <h3>Basic Information</h3>
          <mat-form-field appearance="outline">
            <mat-label>Tool ID</mat-label>
            <input matInput formControlName="toolId" placeholder="my-tool-id">
            <mat-hint>Unique identifier for the tool</mat-hint>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Name</mat-label>
            <input matInput formControlName="name" placeholder="My Tool">
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Description</mat-label>
            <textarea matInput formControlName="description" rows="3" placeholder="Tool description"></textarea>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Domain</mat-label>
            <input matInput formControlName="domain" placeholder="example.com">
          </mat-form-field>
        </div>

        <mat-divider></mat-divider>

        <div class="form-section">
          <h3>Capabilities</h3>
          <mat-form-field appearance="outline">
            <mat-label>Add Capability</mat-label>
            <input matInput #capabilityInput (keyup.enter)="addCapability(capabilityInput.value); capabilityInput.value = ''" placeholder="Type and press Enter">
          </mat-form-field>
          <div class="chips-container">
            <mat-chip *ngFor="let cap of capabilities" (removed)="removeCapability(cap)">
              {{ cap }}
              <button matChipRemove>
                <mat-icon>cancel</mat-icon>
              </button>
            </mat-chip>
          </div>
        </div>

        <mat-divider></mat-divider>

        <div class="form-section">
          <h3>Ownership & Contact</h3>
          <mat-form-field appearance="outline">
            <mat-label>Owner Team</mat-label>
            <input matInput formControlName="ownerTeam" placeholder="platform-team">
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Contact</mat-label>
            <input matInput formControlName="contact" placeholder="team@example.com">
          </mat-form-field>
        </div>

        <mat-divider></mat-divider>

        <div class="form-section">
          <h3>Security & Lifecycle</h3>
          <mat-form-field appearance="outline">
            <mat-label>Security Class</mat-label>
            <mat-select formControlName="securityClass">
              <mat-option value="public">Public</mat-option>
              <mat-option value="internal">Internal</mat-option>
              <mat-option value="restricted">Restricted</mat-option>
              <mat-option value="highly-restricted">Highly Restricted</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
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
        </div>

        <mat-divider></mat-divider>

        <div class="form-section">
          <h3>Rate Limits</h3>
          <mat-checkbox formControlName="includeRateLimits">Include Rate Limits</mat-checkbox>
          <div *ngIf="templateForm.get('includeRateLimits')?.value" class="nested-fields">
            <mat-form-field appearance="outline">
              <mat-label>Max Per Minute</mat-label>
              <input matInput type="number" formControlName="maxPerMinute" placeholder="100">
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Max Concurrency</mat-label>
              <input matInput type="number" formControlName="maxConcurrency" placeholder="5">
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Timeout (ms)</mat-label>
              <input matInput type="number" formControlName="timeoutMs" placeholder="30000">
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Retry Policy</mat-label>
              <mat-select formControlName="retryPolicy">
                <mat-option value="exponential">Exponential</mat-option>
                <mat-option value="linear">Linear</mat-option>
                <mat-option value="fixed">Fixed</mat-option>
              </mat-select>
            </mat-form-field>
          </div>
        </div>

        <mat-divider></mat-divider>

        <div class="form-section">
          <h3>Tags</h3>
          <mat-form-field appearance="outline">
            <mat-label>Add Tag</mat-label>
            <input matInput #tagInput (keyup.enter)="addTag(tagInput.value); tagInput.value = ''" placeholder="Type and press Enter">
          </mat-form-field>
          <div class="chips-container">
            <mat-chip *ngFor="let tag of tags" (removed)="removeTag(tag)">
              {{ tag }}
              <button matChipRemove>
                <mat-icon>cancel</mat-icon>
              </button>
            </mat-chip>
          </div>
        </div>

        <mat-divider></mat-divider>

        <div class="form-section">
          <h3>Optional Fields</h3>
          <mat-checkbox formControlName="includeDependencyGraph">Include Dependency Graph</mat-checkbox>
          <div *ngIf="templateForm.get('includeDependencyGraph')?.value" class="nested-fields">
            <mat-form-field appearance="outline">
              <mat-label>Depends On Tools (comma-separated)</mat-label>
              <input matInput formControlName="dependsOnTools" placeholder="tool1, tool2">
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Depends On Services (comma-separated)</mat-label>
              <input matInput formControlName="dependsOnServices" placeholder="service1, service2">
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Model Dependencies (comma-separated)</mat-label>
              <input matInput formControlName="modelDependencies" placeholder="model1, model2">
            </mat-form-field>
          </div>

          <mat-checkbox formControlName="includeGitOpsSource">Include GitOps Source</mat-checkbox>
          <div *ngIf="templateForm.get('includeGitOpsSource')?.value" class="nested-fields">
            <mat-form-field appearance="outline">
              <mat-label>Repository URL</mat-label>
              <input matInput formControlName="gitRepo" placeholder="https://github.com/org/repo">
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Commit Hash</mat-label>
              <input matInput formControlName="gitCommit" placeholder="abc123">
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Branch</mat-label>
              <input matInput formControlName="gitBranch" placeholder="main">
            </mat-form-field>
          </div>

          <mat-checkbox formControlName="includeRetirementPlan">Include Retirement Plan</mat-checkbox>
          <div *ngIf="templateForm.get('includeRetirementPlan')?.value" class="nested-fields">
            <mat-checkbox formControlName="autoSunset">Auto Sunset</mat-checkbox>
            <mat-form-field appearance="outline">
              <mat-label>Retirement Date</mat-label>
              <input matInput type="date" formControlName="retirementDate">
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Replacement Tool ID</mat-label>
              <input matInput formControlName="replacementToolId" placeholder="new-tool-id">
            </mat-form-field>
          </div>

          <mat-checkbox formControlName="includeVersions">Include Versions</mat-checkbox>
          <div *ngIf="templateForm.get('includeVersions')?.value" class="nested-fields">
            <mat-form-field appearance="outline">
              <mat-label>Initial Version</mat-label>
              <input matInput formControlName="initialVersion" placeholder="1.0.0">
            </mat-form-field>
          </div>

          <mat-form-field appearance="outline">
            <mat-label>Policy Reference</mat-label>
            <input matInput formControlName="policyRef" placeholder="policy-id">
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Quality Score (0-100)</mat-label>
            <input matInput type="number" min="0" max="100" formControlName="qualityScore" placeholder="85">
          </mat-form-field>
        </div>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="cancel()">Cancel</button>
      <button mat-raised-button color="primary" (click)="generate()" [disabled]="!templateForm.valid">
        <mat-icon>code</mat-icon>
        Generate YAML
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .template-form {
      min-width: 600px;
      max-width: 800px;
    }
    .form-section {
      margin: 20px 0;
    }
    .form-section h3 {
      margin-bottom: 16px;
      color: #333;
      font-size: 16px;
      font-weight: 500;
    }
    mat-form-field {
      width: 100%;
      margin-bottom: 16px;
    }
    .nested-fields {
      margin-top: 16px;
      padding-left: 16px;
      border-left: 2px solid #e0e0e0;
    }
    .chips-container {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 8px;
    }
    mat-divider {
      margin: 24px 0;
    }
  `]
})
export class YamlTemplateGeneratorComponent {
  templateForm: FormGroup;
  capabilities: string[] = [];
  tags: string[] = [];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<YamlTemplateGeneratorComponent>,
    @Inject(MAT_DIALOG_DATA) public data: TemplateGeneratorData
  ) {
    this.templateForm = this.fb.group({
      toolId: ['', Validators.required],
      name: ['', Validators.required],
      description: [''],
      domain: [''],
      ownerTeam: [''],
      contact: [''],
      securityClass: ['internal'],
      lifecycleState: ['development'],
      includeRateLimits: [true],
      maxPerMinute: [100],
      maxConcurrency: [5],
      timeoutMs: [30000],
      retryPolicy: ['exponential'],
      includeDependencyGraph: [false],
      dependsOnTools: [''],
      dependsOnServices: [''],
      modelDependencies: [''],
      includeGitOpsSource: [false],
      gitRepo: [''],
      gitCommit: [''],
      gitBranch: [''],
      includeRetirementPlan: [false],
      autoSunset: [false],
      retirementDate: [''],
      replacementToolId: [''],
      includeVersions: [false],
      initialVersion: ['1.0.0'],
      policyRef: [''],
      qualityScore: ['']
    });
  }

  addCapability(value: string): void {
    if (value && !this.capabilities.includes(value)) {
      this.capabilities.push(value);
    }
  }

  removeCapability(cap: string): void {
    const index = this.capabilities.indexOf(cap);
    if (index >= 0) {
      this.capabilities.splice(index, 1);
    }
  }

  addTag(value: string): void {
    if (value && !this.tags.includes(value)) {
      this.tags.push(value);
    }
  }

  removeTag(tag: string): void {
    const index = this.tags.indexOf(tag);
    if (index >= 0) {
      this.tags.splice(index, 1);
    }
  }

  generate(): void {
    if (!this.templateForm.valid) {
      return;
    }

    const formValue = this.templateForm.value;
    let yaml = `toolId: "${formValue.toolId || ''}"
name: "${formValue.name || ''}"
description: "${formValue.description || ''}"
domain: "${formValue.domain || ''}"
capabilities:
`;

    if (this.capabilities.length > 0) {
      this.capabilities.forEach(cap => {
        yaml += `  - "${cap}"\n`;
      });
    } else {
      yaml += `  []\n`;
    }

    yaml += `ownerTeam: "${formValue.ownerTeam || ''}"
contact: "${formValue.contact || ''}"
securityClass: ${formValue.securityClass || 'internal'}
lifecycleState: ${formValue.lifecycleState || 'development'}
tags:
`;

    if (this.tags.length > 0) {
      this.tags.forEach(tag => {
        yaml += `  - "${tag}"\n`;
      });
    } else {
      yaml += `  []\n`;
    }

    if (formValue.includeRateLimits) {
      yaml += `rateLimits:
  maxPerMinute: ${formValue.maxPerMinute || 100}
  maxConcurrency: ${formValue.maxConcurrency || 5}
  timeoutMs: ${formValue.timeoutMs || 30000}
  retryPolicy: ${formValue.retryPolicy || 'exponential'}
`;
    }

    if (formValue.includeDependencyGraph) {
      yaml += `dependencyGraph:
  dependsOnTools:
`;
      if (formValue.dependsOnTools) {
        formValue.dependsOnTools.split(',').forEach((tool: string) => {
          const trimmed = tool.trim();
          if (trimmed) {
            yaml += `    - "${trimmed}"\n`;
          }
        });
      } else {
        yaml += `    []\n`;
      }
      yaml += `  dependsOnServices:
`;
      if (formValue.dependsOnServices) {
        formValue.dependsOnServices.split(',').forEach((service: string) => {
          const trimmed = service.trim();
          if (trimmed) {
            yaml += `    - "${trimmed}"\n`;
          }
        });
      } else {
        yaml += `    []\n`;
      }
      yaml += `  modelDependencies:
`;
      if (formValue.modelDependencies) {
        formValue.modelDependencies.split(',').forEach((model: string) => {
          const trimmed = model.trim();
          if (trimmed) {
            yaml += `    - "${trimmed}"\n`;
          }
        });
      } else {
        yaml += `    []\n`;
      }
    }

    if (formValue.includeGitOpsSource) {
      yaml += `gitOpsSource:
  repo: "${formValue.gitRepo || ''}"
  commit: "${formValue.gitCommit || ''}"
`;
      if (formValue.gitBranch) {
        yaml += `  branch: "${formValue.gitBranch}"\n`;
      }
    }

    if (formValue.includeRetirementPlan) {
      yaml += `retirementPlan:
  autoSunset: ${formValue.autoSunset || false}
`;
      if (formValue.retirementDate) {
        yaml += `  retirementDate: "${formValue.retirementDate}"\n`;
      }
      if (formValue.replacementToolId) {
        yaml += `  replacementToolId: "${formValue.replacementToolId}"\n`;
      }
    }

    if (formValue.includeVersions && formValue.initialVersion) {
      yaml += `versions:
  - version: "${formValue.initialVersion}"
    schema: {}
    deprecated: false
`;
    }

    if (formValue.policyRef) {
      yaml += `policyRef: "${formValue.policyRef}"\n`;
    }

    if (formValue.qualityScore) {
      yaml += `qualityScore: ${formValue.qualityScore}\n`;
    }

    this.data.onGenerate(yaml);
    this.dialogRef.close();
  }

  cancel(): void {
    this.dialogRef.close();
  }
}

