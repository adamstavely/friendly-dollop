import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
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
    }
    mat-sidenav {
      width: 250px;
    }
    mat-nav-list a {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    mat-nav-list a.active {
      background-color: rgba(0, 0, 0, 0.1);
    }
    .content {
      padding: 20px;
    }
  `]
})
export class MainLayoutComponent {}

