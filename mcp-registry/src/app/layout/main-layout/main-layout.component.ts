import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { filter } from 'rxjs/operators';
import { GlobalSearchComponent } from '../../shared/components/global-search/global-search.component';
import { KeyboardShortcutsHelpComponent } from '../../shared/components/keyboard-shortcuts-help/keyboard-shortcuts-help.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    RouterOutlet,
    MatSidenavModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatExpansionModule,
    MatTooltipModule,
    GlobalSearchComponent
  ],
  template: `
    <mat-sidenav-container class="sidenav-container">
      <mat-sidenav mode="side" opened>
        <mat-nav-list>
          <!-- Always Visible Items -->
          <a mat-list-item routerLink="/dashboard" routerLinkActive="active">
            <mat-icon>dashboard</mat-icon>
            <span>Dashboard</span>
          </a>
          <a mat-list-item routerLink="/tools" routerLinkActive="active">
            <mat-icon>build</mat-icon>
            <span>Tools</span>
          </a>

          <!-- Governance Group -->
          <mat-expansion-panel [expanded]="isGroupExpanded('governance')" (opened)="expandGroup('governance')" (closed)="collapseGroup('governance')" class="nav-group">
            <mat-expansion-panel-header>
              <mat-panel-title>
                <mat-icon>gavel</mat-icon>
                <span>Governance</span>
              </mat-panel-title>
            </mat-expansion-panel-header>
            <mat-nav-list>
              <a mat-list-item routerLink="/lifecycle" routerLinkActive="active">
                <mat-icon>timeline</mat-icon>
                <span>Lifecycle</span>
              </a>
              <a mat-list-item routerLink="/quality" routerLinkActive="active">
                <mat-icon>assessment</mat-icon>
                <span>Quality</span>
              </a>
              <a mat-list-item routerLink="/compliance" routerLinkActive="active">
                <mat-icon>verified</mat-icon>
                <span>Compliance</span>
              </a>
            </mat-nav-list>
          </mat-expansion-panel>

          <!-- Operations Group -->
          <mat-expansion-panel [expanded]="isGroupExpanded('operations')" (opened)="expandGroup('operations')" (closed)="collapseGroup('operations')" class="nav-group">
            <mat-expansion-panel-header>
              <mat-panel-title>
                <mat-icon>settings</mat-icon>
                <span>Operations</span>
              </mat-panel-title>
            </mat-expansion-panel-header>
            <mat-nav-list>
              <a mat-list-item routerLink="/dependencies" routerLinkActive="active">
                <mat-icon>account_tree</mat-icon>
                <span>Dependencies</span>
              </a>
              <a mat-list-item routerLink="/bundles" routerLinkActive="active">
                <mat-icon>inventory_2</mat-icon>
                <span>Bundles</span>
              </a>
              <a mat-list-item routerLink="/policies" routerLinkActive="active">
                <mat-icon>policy</mat-icon>
                <span>Policies</span>
              </a>
            </mat-nav-list>
          </mat-expansion-panel>

          <!-- Development Group -->
          <mat-expansion-panel [expanded]="isGroupExpanded('development')" (opened)="expandGroup('development')" (closed)="collapseGroup('development')" class="nav-group">
            <mat-expansion-panel-header>
              <mat-panel-title>
                <mat-icon>code</mat-icon>
                <span>Development</span>
              </mat-panel-title>
            </mat-expansion-panel-header>
            <mat-nav-list>
              <a mat-list-item routerLink="/gitops" routerLinkActive="active">
                <mat-icon>code</mat-icon>
                <span>GitOps</span>
              </a>
              <a mat-list-item routerLink="/schema" routerLinkActive="active">
                <mat-icon>schema</mat-icon>
                <span>Schema</span>
              </a>
              <a mat-list-item routerLink="/inspector" routerLinkActive="active">
                <mat-icon>bug_report</mat-icon>
                <span>Inspector</span>
              </a>
            </mat-nav-list>
          </mat-expansion-panel>

          <!-- Administration Group -->
          <mat-expansion-panel [expanded]="isGroupExpanded('administration')" (opened)="expandGroup('administration')" (closed)="collapseGroup('administration')" class="nav-group">
            <mat-expansion-panel-header>
              <mat-panel-title>
                <mat-icon>admin_panel_settings</mat-icon>
                <span>Administration</span>
              </mat-panel-title>
            </mat-expansion-panel-header>
            <mat-nav-list>
              <a mat-list-item routerLink="/personas" routerLinkActive="active">
                <mat-icon>people</mat-icon>
                <span>Personas</span>
              </a>
              <a mat-list-item routerLink="/retirement" routerLinkActive="active">
                <mat-icon>delete</mat-icon>
                <span>Retirement</span>
              </a>
            </mat-nav-list>
          </mat-expansion-panel>
        </mat-nav-list>
      </mat-sidenav>
      <mat-sidenav-content>
        <mat-toolbar color="primary">
          <span>MCP Registry</span>
          <span class="spacer"></span>
          <app-global-search></app-global-search>
          <button mat-icon-button routerLink="/help" matTooltip="Help & Documentation (Ctrl+H)">
            <mat-icon>help_outline</mat-icon>
          </button>
          <button mat-icon-button (click)="showKeyboardShortcuts()" matTooltip="Keyboard Shortcuts (Shift+?)">
            <mat-icon>keyboard</mat-icon>
          </button>
        </mat-toolbar>
        <div class="content">
          <router-outlet></router-outlet>
        </div>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    .sidenav-container {
      height: 100vh;
      background: transparent;
    }
    mat-sidenav {
      width: 260px;
    }
    mat-nav-list {
      padding: 12px 8px;
    }
    mat-nav-list a {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 16px;
      margin: 2px 8px;
      border-radius: 12px;
      font-weight: 500;
      font-size: 14px;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }
    mat-nav-list a mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      opacity: 0.8;
    }
    mat-nav-list a.active mat-icon {
      opacity: 1;
    }
    .nav-group {
      box-shadow: none;
      border: none;
      background: transparent;
      margin: 4px 0;
    }
    .nav-group ::ng-deep .mat-expansion-panel-header {
      padding: 10px 16px;
      margin: 2px 8px;
      border-radius: 12px;
      font-weight: 600;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .nav-group ::ng-deep .mat-expansion-panel-header mat-panel-title {
      display: flex;
      align-items: center;
      gap: 12px;
      color: rgba(184, 185, 214, 0.7);
    }
    .nav-group ::ng-deep .mat-expansion-panel-header mat-panel-title mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
    .nav-group ::ng-deep .mat-expansion-panel-body {
      padding: 0;
    }
    .nav-group mat-nav-list {
      padding: 4px 0;
    }
    .nav-group mat-nav-list a {
      padding-left: 48px;
      font-size: 13px;
      font-weight: 400;
    }
    .content {
      padding: 32px;
      background: transparent;
      min-height: calc(100vh - 64px);
    }
    mat-toolbar {
      position: sticky;
      top: 0;
      z-index: 1000;
      display: flex;
      align-items: center;
      gap: 16px;
      font-weight: 600;
      font-size: 18px;
      letter-spacing: -0.02em;
    }
    .spacer {
      flex: 1;
    }
  `]
})
export class MainLayoutComponent implements OnInit {
  private expandedGroups: Set<string> = new Set();

  constructor(
    private router: Router,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    // Load expanded groups from localStorage
    const saved = localStorage.getItem('nav-expanded-groups');
    if (saved) {
      try {
        this.expandedGroups = new Set(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse expanded groups:', e);
      }
    }

    // Auto-expand group if current route is in that group
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      const url = event.urlAfterRedirects;
      this.autoExpandGroupForRoute(url);
    });

    // Check initial route
    this.autoExpandGroupForRoute(this.router.url);
  }

  isGroupExpanded(group: string): boolean {
    return this.expandedGroups.has(group);
  }

  expandGroup(group: string): void {
    this.expandedGroups.add(group);
    this.saveExpandedGroups();
  }

  collapseGroup(group: string): void {
    this.expandedGroups.delete(group);
    this.saveExpandedGroups();
  }

  private autoExpandGroupForRoute(url: string): void {
    const routeGroups: { [key: string]: string[] } = {
      governance: ['/lifecycle', '/quality', '/compliance'],
      operations: ['/dependencies', '/bundles', '/policies'],
      development: ['/gitops', '/schema', '/inspector'],
      administration: ['/personas', '/retirement']
    };

    for (const [group, routes] of Object.entries(routeGroups)) {
      if (routes.some(route => url.startsWith(route))) {
        this.expandedGroups.add(group);
        this.saveExpandedGroups();
        break;
      }
    }
  }

  private saveExpandedGroups(): void {
    localStorage.setItem('nav-expanded-groups', JSON.stringify(Array.from(this.expandedGroups)));
  }

  showKeyboardShortcuts(): void {
    this.dialog.open(KeyboardShortcutsHelpComponent, {
      width: '500px'
    });
  }
}

