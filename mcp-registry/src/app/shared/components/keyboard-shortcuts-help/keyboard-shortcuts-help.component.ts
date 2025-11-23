import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { KeyboardShortcutsService, KeyboardShortcut } from '../../../core/services/keyboard-shortcuts.service';

@Component({
  selector: 'app-keyboard-shortcuts-help',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatChipsModule
  ],
  template: `
    <h2 mat-dialog-title>Keyboard Shortcuts</h2>
    <mat-dialog-content>
      <mat-list>
        <mat-list-item *ngFor="let shortcut of shortcuts">
          <mat-icon matListItemIcon>keyboard</mat-icon>
          <div matListItemTitle>{{ shortcut.description }}</div>
          <div matListItemLine>
            <mat-chip *ngIf="shortcut.ctrl || shortcut.meta">Ctrl/Cmd</mat-chip>
            <mat-chip *ngIf="shortcut.shift">Shift</mat-chip>
            <mat-chip *ngIf="shortcut.alt">Alt</mat-chip>
            <mat-chip>{{ shortcut.key.toUpperCase() }}</mat-chip>
          </div>
        </mat-list-item>
      </mat-list>
      <p *ngIf="shortcuts.length === 0" class="no-shortcuts">
        No keyboard shortcuts registered yet.
      </p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="close()">Close</button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-dialog-content {
      min-width: 400px;
      max-height: 500px;
      overflow-y: auto;
    }
    .no-shortcuts {
      text-align: center;
      color: #666;
      padding: 40px 20px;
    }
    mat-chip {
      margin: 2px 4px;
    }
  `]
})
export class KeyboardShortcutsHelpComponent implements OnInit {
  shortcuts: KeyboardShortcut[] = [];

  constructor(
    public dialogRef: MatDialogRef<KeyboardShortcutsHelpComponent>,
    private shortcutsService: KeyboardShortcutsService
  ) {}

  ngOnInit(): void {
    this.shortcuts = this.shortcutsService.getShortcuts();
  }

  close(): void {
    this.dialogRef.close();
  }
}

