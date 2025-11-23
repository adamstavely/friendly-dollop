import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { GitOpsService } from '../../services/gitops.service';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';

declare var monaco: any;

@Component({
  selector: 'app-yaml-editor',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    LoadingSpinnerComponent
  ],
  template: `
    <div class="yaml-editor">
      <mat-card>
        <mat-card-header>
          <mat-card-title>YAML Editor</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="editor-toolbar">
            <button mat-raised-button color="primary" (click)="validateYaml()">
              <mat-icon>check_circle</mat-icon>
              Validate
            </button>
            <button mat-raised-button (click)="formatYaml()">
              <mat-icon>format_align_left</mat-icon>
              Format
            </button>
            <button mat-raised-button (click)="loadTemplate()">
              <mat-icon>file_copy</mat-icon>
              Load Template
            </button>
          </div>
          <div #editorContainer class="editor-container"></div>
          <div *ngIf="validationErrors.length > 0" class="validation-errors">
            <h4>Validation Errors:</h4>
            <mat-chip *ngFor="let error of validationErrors" class="error-chip">
              {{ error }}
            </mat-chip>
          </div>
          <div *ngIf="validationSuccess" class="validation-success">
            <mat-chip class="success-chip">✓ YAML is valid</mat-chip>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .yaml-editor {
      padding: 20px;
    }
    .editor-toolbar {
      display: flex;
      gap: 8px;
      margin-bottom: 16px;
    }
    .editor-container {
      width: 100%;
      height: 500px;
      border: 1px solid #ccc;
    }
    .validation-errors {
      margin-top: 16px;
      padding: 16px;
      background: #ffebee;
      border-radius: 4px;
    }
    .validation-success {
      margin-top: 16px;
    }
    .error-chip {
      background-color: #f44336;
      color: white;
      margin: 4px;
    }
    .success-chip {
      background-color: #4caf50;
      color: white;
    }
  `]
})
export class YamlEditorComponent implements OnInit, AfterViewInit {
  @ViewChild('editorContainer', { static: false }) editorContainer!: ElementRef;
  editor: any;
  yamlContent: string = '';
  validationErrors: string[] = [];
  validationSuccess: boolean = false;

  constructor(private gitOpsService: GitOpsService) {}

  ngOnInit(): void {
    this.loadTemplate();
  }

  ngAfterViewInit(): void {
    this.initializeEditor();
  }

  initializeEditor(): void {
    if (typeof monaco === 'undefined') {
      console.error('Monaco Editor not loaded');
      return;
    }

    this.editor = monaco.editor.create(this.editorContainer.nativeElement, {
      value: this.yamlContent,
      language: 'yaml',
      theme: 'vs',
      automaticLayout: true,
      minimap: { enabled: true }
    });

    this.editor.onDidChangeModelContent(() => {
      this.validationSuccess = false;
      this.validationErrors = [];
    });
  }

  loadTemplate(): void {
    this.yamlContent = `toolId: ""
name: ""
description: ""
domain: ""
capabilities: []
ownerTeam: ""
contact: ""
securityClass: internal
lifecycleState: development
tags: []
rateLimits:
  maxPerMinute: 100
  maxConcurrency: 5
  timeoutMs: 30000
  retryPolicy: exponential
`;
    if (this.editor) {
      this.editor.setValue(this.yamlContent);
    }
  }

  validateYaml(): void {
    const content = this.editor ? this.editor.getValue() : this.yamlContent;
    this.gitOpsService.validateYaml(content).subscribe({
      next: (result: any) => {
        if (result.valid) {
          this.validationSuccess = true;
          this.validationErrors = [];
        } else {
          this.validationSuccess = false;
          this.validationErrors = result.errors || ['Validation failed'];
        }
      },
      error: (err: any) => {
        this.validationSuccess = false;
        this.validationErrors = [err.message || 'Validation error'];
      }
    });
  }

  formatYaml(): void {
    if (this.editor) {
      this.editor.getAction('editor.action.formatDocument').run();
    }
  }

  getYamlContent(): string {
    return this.editor ? this.editor.getValue() : this.yamlContent;
  }
}

