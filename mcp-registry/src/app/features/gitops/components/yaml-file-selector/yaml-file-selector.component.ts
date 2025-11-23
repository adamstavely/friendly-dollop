import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { DatePipe } from '@angular/common';

export interface SavedFile {
  id: string;
  name: string;
  content: string;
  timestamp: string;
}

export interface FileSelectorData {
  files: SavedFile[];
  onSelect: (file: SavedFile) => void;
}

@Component({
  selector: 'app-yaml-file-selector',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    DatePipe
  ],
  template: `
    <h2 mat-dialog-title>Load Saved YAML File</h2>
    <mat-dialog-content>
      <div *ngIf="data.files.length === 0" class="no-files">
        <mat-icon>folder_open</mat-icon>
        <p>No saved files found</p>
      </div>
      <mat-list *ngIf="data.files.length > 0">
        <mat-list-item 
          *ngFor="let file of data.files; let i = index" 
          (click)="selectFile(file)"
          class="file-item">
          <mat-icon matListItemIcon>description</mat-icon>
          <div matListItemTitle>{{ file.name }}</div>
          <div matListItemLine>{{ file.timestamp | date:'short' }}</div>
        </mat-list-item>
      </mat-list>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="cancel()">Cancel</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .no-files {
      text-align: center;
      padding: 40px 20px;
      color: #666;
    }
    .no-files mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
      opacity: 0.5;
    }
    .file-item {
      cursor: pointer;
      transition: background-color 0.2s;
    }
    .file-item:hover {
      background-color: #f5f5f5;
    }
    mat-list {
      max-height: 400px;
      overflow-y: auto;
    }
  `]
})
export class YamlFileSelectorComponent {
  constructor(
    private dialogRef: MatDialogRef<YamlFileSelectorComponent>,
    @Inject(MAT_DIALOG_DATA) public data: FileSelectorData
  ) {}

  selectFile(file: SavedFile): void {
    this.data.onSelect(file);
    this.dialogRef.close(file);
  }

  cancel(): void {
    this.dialogRef.close();
  }
}

