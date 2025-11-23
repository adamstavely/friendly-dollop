import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig, MatSnackBarRef, SimpleSnackBar } from '@angular/material/snack-bar';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastConfig {
  message: string;
  type?: ToastType;
  duration?: number;
  action?: string;
  actionCallback?: () => void;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private defaultDuration = 3000;
  private defaultConfig: MatSnackBarConfig = {
    duration: this.defaultDuration,
    horizontalPosition: 'right',
    verticalPosition: 'top'
  };

  constructor(private snackBar: MatSnackBar) {}

  show(config: ToastConfig): MatSnackBarRef<SimpleSnackBar> {
    const snackBarConfig: MatSnackBarConfig = {
      ...this.defaultConfig,
      duration: config.duration ?? this.defaultDuration,
      panelClass: this.getPanelClass(config.type || 'info')
    };

    const ref = this.snackBar.open(
      config.message,
      config.action || 'Close',
      snackBarConfig
    );

    if (config.actionCallback && config.action) {
      ref.onAction().subscribe(() => {
        config.actionCallback!();
      });
    }

    return ref;
  }

  success(message: string, duration?: number): MatSnackBarRef<SimpleSnackBar> {
    return this.show({ message, type: 'success', duration });
  }

  error(message: string, duration?: number): MatSnackBarRef<SimpleSnackBar> {
    return this.show({ message, type: 'error', duration: duration || 5000 });
  }

  warning(message: string, duration?: number): MatSnackBarRef<SimpleSnackBar> {
    return this.show({ message, type: 'warning', duration });
  }

  info(message: string, duration?: number): MatSnackBarRef<SimpleSnackBar> {
    return this.show({ message, type: 'info', duration });
  }

  private getPanelClass(type: ToastType): string[] {
    const classes: Record<ToastType, string> = {
      success: 'toast-success',
      error: 'toast-error',
      warning: 'toast-warning',
      info: 'toast-info'
    };
    return ['toast', classes[type]];
  }
}

