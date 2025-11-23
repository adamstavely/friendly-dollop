import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { BundleService } from '../../services/bundle.service';
import { Bundle } from '../../../../shared/models/bundle.model';

@Component({
  selector: 'app-bundle-list',
  standalone: true,
  imports: [CommonModule, RouterModule, MatCardModule, MatButtonModule],
  template: `
    <div class="bundle-list">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Tool Bundles</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <p>Bundle list will be displayed here.</p>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .bundle-list {
      padding: 20px;
    }
  `]
})
export class BundleListComponent implements OnInit {
  bundles: Bundle[] = [];

  constructor(private bundleService: BundleService) {}

  ngOnInit(): void {
    this.bundleService.getBundles().subscribe({
      next: (bundles) => {
        this.bundles = bundles;
      }
    });
  }
}

