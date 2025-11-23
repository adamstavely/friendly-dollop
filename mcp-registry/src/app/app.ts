import { Component, OnInit } from '@angular/core';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { KeyboardShortcutsService } from './core/services/keyboard-shortcuts.service';
import { MatDialog } from '@angular/material/dialog';
import { KeyboardShortcutsHelpComponent } from './shared/components/keyboard-shortcuts-help/keyboard-shortcuts-help.component';

@Component({
  selector: 'app-root',
  imports: [MainLayoutComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  constructor(
    private shortcutsService: KeyboardShortcutsService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    // Register global keyboard shortcuts
    this.shortcutsService.register({
      key: 'k',
      ctrl: true,
      description: 'Open global search',
      action: () => {
        // This is handled by GlobalSearchComponent
        const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      }
    });

    this.shortcutsService.register({
      key: '?',
      shift: true,
      description: 'Show keyboard shortcuts',
      action: () => {
        this.dialog.open(KeyboardShortcutsHelpComponent, {
          width: '500px'
        });
      }
    });

    this.shortcutsService.register({
      key: 'h',
      ctrl: true,
      description: 'Open help',
      action: () => {
        window.location.href = '/help';
      }
    });
  }
}
