import { Component, Input, OnInit, ViewChild, ElementRef, AfterViewInit, Inject, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

declare var monaco: any;

export interface DiffViewerData {
  originalContent?: string;
  modifiedContent?: string;
}

@Component({
  selector: 'app-yaml-diff-viewer',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule
  ],
  template: `
    <div class="yaml-diff-viewer">
      <mat-card>
        <mat-card-header>
          <mat-card-title>YAML Diff Viewer</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="diff-controls">
            <button mat-raised-button (click)="loadFromFile('original')">
              <mat-icon>upload_file</mat-icon>
              Load Original
            </button>
            <button mat-raised-button (click)="loadFromFile('modified')">
              <mat-icon>upload_file</mat-icon>
              Load Modified
            </button>
            <button mat-raised-button (click)="swapFiles()" [disabled]="!originalContent || !modifiedContent">
              <mat-icon>swap_horiz</mat-icon>
              Swap
            </button>
            <button mat-raised-button (click)="clearDiff()">
              <mat-icon>clear</mat-icon>
              Clear
            </button>
          </div>
          <div #diffContainer class="diff-container"></div>
          <input type="file" accept=".yaml,.yml" #fileInput style="display: none" (change)="onFileSelected($event)">
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .yaml-diff-viewer {
      padding: 20px;
    }
    .diff-controls {
      display: flex;
      gap: 8px;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }
    .diff-container {
      width: 100%;
      height: 600px;
      border: 1px solid #ccc;
    }
  `]
})
export class YamlDiffViewerComponent implements OnInit, AfterViewInit {
  @ViewChild('diffContainer', { static: false }) diffContainer!: ElementRef;
  @ViewChild('fileInput', { static: false }) fileInput!: ElementRef;
  
  diffEditor: any;
  originalContent: string = '';
  modifiedContent: string = '';
  currentFileType: 'original' | 'modified' | null = null;

  constructor(
    @Optional() @Inject(MAT_DIALOG_DATA) public data?: DiffViewerData,
    @Optional() private dialogRef?: MatDialogRef<YamlDiffViewerComponent>
  ) {
    if (data) {
      this.originalContent = data.originalContent || '';
      this.modifiedContent = data.modifiedContent || '';
    }
  }

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.initializeDiffEditor();
    // Update diff after initialization if content is already set
    if (this.originalContent || this.modifiedContent) {
      setTimeout(() => this.updateDiff(), 100);
    }
  }

  initializeDiffEditor(): void {
    if (typeof monaco === 'undefined') {
      console.error('Monaco Editor not loaded');
      return;
    }

    this.diffEditor = monaco.editor.createDiffEditor(this.diffContainer.nativeElement, {
      theme: 'vs',
      automaticLayout: true,
      minimap: { enabled: true },
      readOnly: false,
      renderSideBySide: true
    });
  }

  loadFromFile(type: 'original' | 'modified'): void {
    this.currentFileType = type;
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || !this.currentFileType) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (this.currentFileType === 'original') {
        this.originalContent = content;
      } else {
        this.modifiedContent = content;
      }
      this.updateDiff();
    };
    reader.readAsText(file);
  }

  setOriginalContent(content: string): void {
    this.originalContent = content;
    this.updateDiff();
  }

  setModifiedContent(content: string): void {
    this.modifiedContent = content;
    this.updateDiff();
  }

  updateDiff(): void {
    if (!this.diffEditor) {
      return;
    }

    const originalModel = monaco.editor.createModel(
      this.originalContent,
      'yaml'
    );
    const modifiedModel = monaco.editor.createModel(
      this.modifiedContent,
      'yaml'
    );

    this.diffEditor.setModel({
      original: originalModel,
      modified: modifiedModel
    });
  }

  swapFiles(): void {
    const temp = this.originalContent;
    this.originalContent = this.modifiedContent;
    this.modifiedContent = temp;
    this.updateDiff();
  }

  clearDiff(): void {
    this.originalContent = '';
    this.modifiedContent = '';
    if (this.diffEditor) {
      this.diffEditor.setModel({
        original: monaco.editor.createModel('', 'yaml'),
        modified: monaco.editor.createModel('', 'yaml')
      });
    }
  }

  getOriginalContent(): string {
    return this.originalContent;
  }

  getModifiedContent(): string {
    return this.modifiedContent;
  }
}

