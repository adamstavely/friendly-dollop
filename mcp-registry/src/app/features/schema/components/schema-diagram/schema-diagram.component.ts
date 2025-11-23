import { Component, Input, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';

declare var mermaid: any;

@Component({
  selector: 'app-schema-diagram',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    FormsModule,
    LoadingSpinnerComponent
  ],
  template: `
    <div class="schema-diagram">
      <div class="diagram-controls">
        <mat-form-field>
          <mat-label>Diagram Type</mat-label>
          <mat-select [(ngModel)]="diagramType" (selectionChange)="renderDiagram()">
            <mat-option value="flowchart">Flowchart</mat-option>
            <mat-option value="classDiagram">Class Diagram</mat-option>
            <mat-option value="graph">Graph</mat-option>
          </mat-select>
        </mat-form-field>
        <button mat-raised-button (click)="exportDiagram()">
          <mat-icon>download</mat-icon>
          Export
        </button>
      </div>
      <app-loading-spinner *ngIf="rendering" message="Rendering diagram..."></app-loading-spinner>
      <div #diagramContainer class="diagram-container"></div>
    </div>
  `,
  styles: [`
    .schema-diagram {
      padding: 16px;
    }
    .diagram-controls {
      display: flex;
      gap: 16px;
      margin-bottom: 16px;
      align-items: center;
    }
    .diagram-controls mat-form-field {
      flex: 0 0 200px;
    }
    .diagram-container {
      width: 100%;
      min-height: 400px;
      border: 1px solid #ccc;
      border-radius: 4px;
      padding: 16px;
      background: white;
    }
  `]
})
export class SchemaDiagramComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() schema: any;
  @ViewChild('diagramContainer', { static: false }) diagramContainer!: ElementRef;
  
  diagramType: string = 'flowchart';
  rendering: boolean = false;
  diagramId: string = '';

  ngOnInit(): void {
    this.diagramId = `diagram-${Date.now()}`;
  }

  ngAfterViewInit(): void {
    if (typeof mermaid !== 'undefined') {
      mermaid.initialize({ startOnLoad: false, theme: 'default' });
      this.renderDiagram();
    }
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  renderDiagram(): void {
    if (!this.schema || !this.diagramContainer) return;

    this.rendering = true;
    const mermaidCode = this.generateMermaidCode();

    setTimeout(() => {
      if (typeof mermaid !== 'undefined') {
        mermaid.render(this.diagramId, mermaidCode).then((result: any) => {
          this.diagramContainer.nativeElement.innerHTML = result.svg;
          this.rendering = false;
        }).catch((err: any) => {
          console.error('Error rendering diagram:', err);
          this.rendering = false;
        });
      } else {
        this.rendering = false;
      }
    }, 100);
  }

  generateMermaidCode(): string {
    if (!this.schema) return '';

    switch (this.diagramType) {
      case 'flowchart':
        return this.generateFlowchart();
      case 'classDiagram':
        return this.generateClassDiagram();
      case 'graph':
        return this.generateGraph();
      default:
        return this.generateFlowchart();
    }
  }

  private generateFlowchart(): string {
    if (!this.schema || !this.schema.properties) {
      return 'flowchart TD\n    A[No Schema Data]';
    }

    let code = 'flowchart TD\n';
    const props = this.schema.properties || {};
    const keys = Object.keys(props);

    keys.forEach((key, index) => {
      const prop = props[key];
      const type = prop.type || 'any';
      code += `    A${index}["${key}: ${type}"]\n`;
    });

    if (keys.length > 0) {
      code += `    Start([Input]) --> A0\n`;
      for (let i = 0; i < keys.length - 1; i++) {
        code += `    A${i} --> A${i + 1}\n`;
      }
      code += `    A${keys.length - 1} --> End([Output])\n`;
    }

    return code;
  }

  private generateClassDiagram(): string {
    if (!this.schema) {
      return 'classDiagram\n    class NoSchema';
    }

    let code = 'classDiagram\n';
    code += '    class Schema {\n';

    if (this.schema.properties) {
      const props = this.schema.properties;
      Object.keys(props).forEach(key => {
        const prop = props[key];
        const type = prop.type || 'any';
        code += `        +${type} ${key}\n`;
      });
    }

    code += '    }\n';
    return code;
  }

  private generateGraph(): string {
    if (!this.schema || !this.schema.properties) {
      return 'graph TD\n    A[No Schema Data]';
    }

    let code = 'graph TD\n';
    const props = this.schema.properties || {};
    const keys = Object.keys(props);

    keys.forEach((key, index) => {
      const prop = props[key];
      const type = prop.type || 'any';
      code += `    ${index}["${key}<br/>${type}"]\n`;
    });

    for (let i = 0; i < keys.length - 1; i++) {
      code += `    ${i} --> ${i + 1}\n`;
    }

    return code;
  }

  exportDiagram(): void {
    if (this.diagramContainer && this.diagramContainer.nativeElement) {
      const svg = this.diagramContainer.nativeElement.querySelector('svg');
      if (svg) {
        const svgData = new XMLSerializer().serializeToString(svg);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `schema-diagram-${this.diagramType}.svg`;
        link.click();
        URL.revokeObjectURL(url);
      }
    }
  }
}

