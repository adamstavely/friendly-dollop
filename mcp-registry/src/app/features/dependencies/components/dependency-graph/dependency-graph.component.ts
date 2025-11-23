import { Component, OnInit, Input, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';
import { FormsModule } from '@angular/forms';
import { DependencyService } from '../../services/dependency.service';
import { ToolService } from '../../../tools/services/tool.service';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
// @ts-ignore
import cytoscape from 'cytoscape';

@Component({
  selector: 'app-dependency-graph',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatChipsModule,
    FormsModule,
    LoadingSpinnerComponent
  ],
  template: `
    <div class="dependency-graph">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Dependency Graph</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="graph-controls">
            <mat-form-field>
              <mat-label>Filter by State</mat-label>
              <mat-select [(ngModel)]="filterState" (selectionChange)="applyFilter()">
                <mat-option value="">All</mat-option>
                <mat-option value="development">Development</mat-option>
                <mat-option value="staging">Staging</mat-option>
                <mat-option value="pilot">Pilot</mat-option>
                <mat-option value="production">Production</mat-option>
                <mat-option value="deprecated">Deprecated</mat-option>
              </mat-select>
            </mat-form-field>
            <button mat-raised-button (click)="resetView()">
              <mat-icon>refresh</mat-icon>
              Reset View
            </button>
            <button mat-raised-button (click)="exportGraph()">
              <mat-icon>download</mat-icon>
              Export
            </button>
          </div>
          <app-loading-spinner *ngIf="loading" message="Loading dependency graph..."></app-loading-spinner>
          <div #graphContainer id="graph-container" *ngIf="!loading"></div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .dependency-graph {
      padding: 20px;
    }
    #graph-container {
      width: 100%;
      height: 600px;
      border: 1px solid #ccc;
      background: #fafafa;
    }
    .graph-controls {
      display: flex;
      gap: 16px;
      margin-bottom: 16px;
      align-items: center;
    }
    .graph-controls mat-form-field {
      flex: 0 0 200px;
    }
  `]
})
export class DependencyGraphComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() toolId?: string;
  @ViewChild('graphContainer', { static: false }) graphContainer!: ElementRef;
  
  cy: any = null;
  loading: boolean = false;
  filterState: string = '';
  allNodes: any[] = [];
  allEdges: any[] = [];

  constructor(
    private dependencyService: DependencyService,
    private toolService: ToolService
  ) {}

  ngOnInit(): void {
    this.loadGraphData();
  }

  ngAfterViewInit(): void {
    if (this.graphContainer) {
      this.initializeGraph();
    }
  }

  ngOnDestroy(): void {
    if (this.cy) {
      this.cy.destroy();
    }
  }

  loadGraphData(): void {
    this.loading = true;
    this.toolService.getTools({ limit: 1000 }).subscribe({
      next: (response) => {
        this.allNodes = response.tools.map((tool: any) => ({
          data: {
            id: tool.toolId,
            label: tool.name,
            state: tool.lifecycleState || 'development',
            type: 'tool'
          }
        }));

        // Load dependencies for each tool
        const dependencyPromises = response.tools.map((tool: any) =>
          this.dependencyService.getDependencies(tool.toolId).toPromise()
        );

        Promise.all(dependencyPromises).then((depsArray) => {
          this.allEdges = [];
          response.tools.forEach((tool: any, index: number) => {
            const deps = depsArray[index];
            if (deps && deps.dependsOnTools) {
              deps.dependsOnTools.forEach((depId: string) => {
                this.allEdges.push({
                  data: {
                    id: `${tool.toolId}-${depId}`,
                    source: tool.toolId,
                    target: depId,
                    type: 'depends-on'
                  }
                });
              });
            }
          });
          this.loading = false;
          if (this.cy) {
            this.updateGraph();
          } else {
            this.initializeGraph();
          }
        }).catch((err) => {
          console.error('Error loading dependencies:', err);
          this.loading = false;
        });
      },
      error: (err) => {
        console.error('Error loading graph data:', err);
        this.loading = false;
      }
    });
  }

  initializeGraph(): void {
    if (!this.graphContainer) return;

    this.cy = cytoscape({
      container: this.graphContainer.nativeElement,
      elements: [...this.allNodes, ...this.allEdges],
      style: [
        {
          selector: 'node',
          style: {
            'background-color': (ele: any) => this.getNodeColor(ele.data('state')),
            'label': 'data(label)',
            'width': 60,
            'height': 60,
            'shape': 'round-rectangle',
            'border-width': 2,
            'border-color': '#333',
            'text-valign': 'center',
            'text-halign': 'center',
            'font-size': '12px',
            'color': '#333'
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 2,
            'line-color': '#666',
            'target-arrow-color': '#666',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier'
          }
        },
        {
          selector: 'node[state="production"]',
          style: {
            'background-color': '#4caf50'
          }
        },
        {
          selector: 'node[state="deprecated"]',
          style: {
            'background-color': '#ff9800'
          }
        },
        {
          selector: 'node[state="retired"]',
          style: {
            'background-color': '#9e9e9e'
          }
        }
      ],
      layout: {
        name: 'cose',
        idealEdgeLength: 100,
        nodeOverlap: 20,
        refresh: 20,
        fit: true,
        padding: 30,
        randomize: false,
        componentSpacing: 100,
        nodeRepulsion: 400000,
        edgeElasticity: 100,
        nestingFactor: 5,
        gravity: 80,
        numIter: 1000,
        initialTemp: 200,
        coolingFactor: 0.95,
        minTemp: 1.0
      }
    });

    // Add click handler to navigate to tool detail
    this.cy.on('tap', 'node', (evt: any) => {
      const node = evt.target;
      const toolId = node.id();
      window.location.href = `/tools/${toolId}`;
    });

    // Add hover effects
    this.cy.on('mouseover', 'node', (evt: any) => {
      evt.target.style('border-width', 4);
    });

    this.cy.on('mouseout', 'node', (evt: any) => {
      evt.target.style('border-width', 2);
    });
  }

  updateGraph(): void {
    if (!this.cy) return;

    const filteredNodes = this.filterState
      ? this.allNodes.filter((n: any) => n.data.state === this.filterState)
      : this.allNodes;

    const filteredNodeIds = new Set(filteredNodes.map((n: any) => n.data.id));
    const filteredEdges = this.allEdges.filter((e: any) =>
      filteredNodeIds.has(e.data.source) && filteredNodeIds.has(e.data.target)
    );

    this.cy.elements().remove();
    this.cy.add([...filteredNodes, ...filteredEdges]);
    this.cy.layout({ name: 'cose' }).run();
  }

  getNodeColor(state: string): string {
    const colors: Record<string, string> = {
      'development': '#2196f3',
      'staging': '#9c27b0',
      'pilot': '#ff9800',
      'production': '#4caf50',
      'deprecated': '#ff5722',
      'retired': '#9e9e9e'
    };
    return colors[state] || '#ccc';
  }

  applyFilter(): void {
    this.updateGraph();
  }

  resetView(): void {
    if (this.cy) {
      this.cy.fit();
      this.cy.center();
    }
  }

  exportGraph(): void {
    if (this.cy) {
      const png = this.cy.png({ output: 'blob', full: true });
      const url = URL.createObjectURL(png);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'dependency-graph.png';
      link.click();
      URL.revokeObjectURL(url);
    }
  }
}

