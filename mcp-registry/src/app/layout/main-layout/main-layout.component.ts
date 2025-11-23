import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';

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
    MatListModule
  ],
  template: `
    <mat-sidenav-container class="sidenav-container">
      <mat-sidenav mode="side" opened>
        <mat-nav-list>
          <a mat-list-item routerLink="/dashboard" routerLinkActive="active">
            <mat-icon>dashboard</mat-icon>
            <span>Dashboard</span>
          </a>
          <a mat-list-item routerLink="/tools" routerLinkActive="active">
            <mat-icon>build</mat-icon>
            <span>Tools</span>
          </a>
          <a mat-list-item routerLink="/lifecycle" routerLinkActive="active">
            <mat-icon>timeline</mat-icon>
            <span>Lifecycle</span>
          </a>
          <a mat-list-item routerLink="/dependencies" routerLinkActive="active">
            <mat-icon>account_tree</mat-icon>
            <span>Dependencies</span>
          </a>
          <a mat-list-item routerLink="/quality" routerLinkActive="active">
            <mat-icon>assessment</mat-icon>
            <span>Quality</span>
          </a>
          <a mat-list-item routerLink="/bundles" routerLinkActive="active">
            <mat-icon>inventory_2</mat-icon>
            <span>Bundles</span>
          </a>
          <a mat-list-item routerLink="/policies" routerLinkActive="active">
            <mat-icon>policy</mat-icon>
            <span>Policies</span>
          </a>
          <a mat-list-item routerLink="/gitops" routerLinkActive="active">
            <mat-icon>code</mat-icon>
            <span>GitOps</span>
          </a>
          <a mat-list-item routerLink="/retirement" routerLinkActive="active">
            <mat-icon>delete</mat-icon>
            <span>Retirement</span>
          </a>
          <a mat-list-item routerLink="/personas" routerLinkActive="active">
            <mat-icon>people</mat-icon>
            <span>Personas</span>
          </a>
          <a mat-list-item routerLink="/compliance" routerLinkActive="active">
            <mat-icon>verified</mat-icon>
            <span>Compliance</span>
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
      </mat-sidenav>
      <mat-sidenav-content>
        <mat-toolbar color="primary">
          <span>MCP Registry</span>
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
      width: 250px;
      box-shadow: 2px 0 8px rgba(0, 0, 0, 0.3);
    }
    mat-nav-list a {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      margin: 4px 8px;
      border-radius: 8px;
    }
    mat-nav-list a.active {
      background: linear-gradient(90deg, rgba(74, 20, 140, 0.5) 0%, rgba(106, 27, 154, 0.3) 100%);
      border-left: 3px solid #7b1fa2;
    }
    mat-nav-list a mat-icon {
      color: #9575cd;
    }
    mat-nav-list a.active mat-icon {
      color: #d1c4e9;
    }
    .content {
      padding: 24px;
      background: transparent;
      min-height: calc(100vh - 64px);
    }
    mat-toolbar {
      position: sticky;
      top: 0;
      z-index: 1000;
    }
  `]
})
export class MainLayoutComponent {}

