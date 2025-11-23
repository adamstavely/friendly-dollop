import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ConfirmationDialogComponent } from '../../shared/components/confirmation-dialog/confirmation-dialog.component';

export interface ConfirmationConfig {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: 'primary' | 'accent' | 'warn';
  destructive?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ConfirmationService {
  constructor(private dialog: MatDialog) {}

  confirm(config: ConfirmationConfig): Observable<boolean> {
    const dialogRef: MatDialogRef<ConfirmationDialogComponent, boolean> = this.dialog.open(
      ConfirmationDialogComponent,
      {
        width: '400px',
        data: {
          title: config.title,
          message: config.message,
          confirmText: config.confirmText || 'Confirm',
          cancelText: config.cancelText || 'Cancel',
          confirmColor: config.confirmColor || (config.destructive ? 'warn' : 'primary'),
          destructive: config.destructive || false
        }
      }
    );

    return dialogRef.afterClosed().pipe(
      map(result => result ?? false)
    );
  }

  confirmDelete(itemName: string): Observable<boolean> {
    return this.confirm({
      title: 'Confirm Delete',
      message: `Are you sure you want to delete "${itemName}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      destructive: true
    });
  }

  confirmAction(title: string, message: string): Observable<boolean> {
    return this.confirm({
      title,
      message,
      confirmText: 'Confirm',
      cancelText: 'Cancel'
    });
  }
}

