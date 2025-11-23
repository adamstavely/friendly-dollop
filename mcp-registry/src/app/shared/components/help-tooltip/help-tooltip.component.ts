import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { HelpService } from '../../../core/services/help.service';
import { HelpPageComponent } from '../../../features/help/components/help-page/help-page.component';

@Component({
  selector: 'app-help-tooltip',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatTooltipModule,
    MatButtonModule
  ],
  template: `
    <button 
      mat-icon-button 
      [matTooltip]="tooltip || 'Get help'"
      (click)="openHelp()"
      class="help-button"
      [attr.aria-label]="'Help: ' + (tooltip || 'Get help')">
      <mat-icon>help_outline</mat-icon>
    </button>
  `,
  styles: [`
    .help-button {
      color: #9575cd;
      width: 24px;
      height: 24px;
      line-height: 24px;
    }
    .help-button:hover {
      color: #d1c4e9;
    }
  `]
})
export class HelpTooltipComponent {
  @Input() context?: string;
  @Input() tooltip?: string;
  @Input() articleId?: string;

  constructor(
    private helpService: HelpService,
    private dialog: MatDialog
  ) {}

  openHelp(): void {
    if (this.articleId) {
      this.helpService.getArticle(this.articleId).subscribe(article => {
        if (article) {
          this.openHelpDialog(article);
        } else {
          this.openHelpPage();
        }
      });
    } else if (this.context) {
      this.helpService.getContextualHelp(this.context).subscribe(article => {
        if (article) {
          this.openHelpDialog(article);
        } else {
          this.openHelpPage();
        }
      });
    } else {
      this.openHelpPage();
    }
  }

  private openHelpDialog(article: any): void {
    // For now, open the full help page
    // In the future, could open a smaller dialog with just this article
    this.openHelpPage();
  }

  private openHelpPage(): void {
    this.dialog.open(HelpPageComponent, {
      width: '800px',
      maxWidth: '90vw',
      height: '80vh',
      data: { articleId: this.articleId, context: this.context }
    });
  }
}

