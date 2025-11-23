import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as d3 from 'd3';
import { WorkflowNode, WorkflowConnection, WorkflowDefinition } from '../../../../shared/models/workflow.model';

@Component({
  selector: 'app-workflow-canvas',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="canvas-container">
      <svg #canvas class="workflow-canvas"></svg>
      <div class="canvas-controls">
        <button (click)="zoomIn()" title="Zoom In">
          <span>+</span>
        </button>
        <button (click)="zoomOut()" title="Zoom Out">
          <span>-</span>
        </button>
        <button (click)="resetView()" title="Reset View">
          <span>⌂</span>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .canvas-container {
      position: relative;
      width: 100%;
      height: 600px;
      border: 2px solid #ddd;
      border-radius: 8px;
      background: #fafafa;
      overflow: hidden;
    }
    .workflow-canvas {
      width: 100%;
      height: 100%;
      cursor: grab;
    }
    .workflow-canvas:active {
      cursor: grabbing;
    }
    .node {
      cursor: pointer;
    }
    .node-rect {
      fill: white;
      stroke: #6366f1;
      stroke-width: 2;
      rx: 8;
    }
    .node-rect.selected {
      stroke: #8b5cf6;
      stroke-width: 3;
      filter: drop-shadow(0 4px 6px rgba(99, 102, 241, 0.3));
    }
    .node-rect.input {
      fill: #dbeafe;
    }
    .node-rect.output {
      fill: #dcfce7;
    }
    .node-rect.mcp-tool {
      fill: #fef3c7;
    }
    .node-rect.llm {
      fill: #e9d5ff;
    }
    .node-text {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 12px;
      font-weight: 500;
      fill: #1f2937;
      pointer-events: none;
    }
    .node-icon {
      font-size: 16px;
      fill: #6366f1;
    }
    .connection {
      fill: none;
      stroke: #9ca3af;
      stroke-width: 2;
      marker-end: url(#arrowhead);
    }
    .connection.selected {
      stroke: #6366f1;
      stroke-width: 3;
    }
    .connection-point {
      fill: #6366f1;
      stroke: white;
      stroke-width: 2;
      r: 6;
      cursor: crosshair;
    }
    .connection-point:hover {
      r: 8;
      fill: #8b5cf6;
    }
    .canvas-controls {
      position: absolute;
      top: 10px;
      right: 10px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      z-index: 10;
    }
    .canvas-controls button {
      width: 32px;
      height: 32px;
      border: 1px solid #ddd;
      border-radius: 4px;
      background: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      color: #6366f1;
    }
    .canvas-controls button:hover {
      background: #f3f4f6;
      border-color: #6366f1;
    }
  `]
})
export class WorkflowCanvasComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() nodes: WorkflowNode[] = [];
  @Input() connections: WorkflowConnection[] = [];
  @Input() selectedNodeId: string | null = null;
  @Output() nodeSelected = new EventEmitter<WorkflowNode>();
  @Output() nodeMoved = new EventEmitter<{ nodeId: string; position: { x: number; y: number } }>();
  @Output() connectionCreated = new EventEmitter<WorkflowConnection>();
  @Output() connectionDeleted = new EventEmitter<string>();

  @ViewChild('canvas', { static: false }) canvasRef!: ElementRef<SVGElement>;

  private svg!: d3.Selection<SVGElement, unknown, null, undefined>;
  private g!: d3.Selection<SVGGElement, unknown, null, undefined>;
  private zoom!: d3.ZoomBehavior<SVGElement, unknown>;
  private nodeElements!: d3.Selection<SVGGElement, WorkflowNode, SVGGElement, unknown>;
  private connectionElements!: d3.Selection<SVGPathElement, WorkflowConnection, SVGGElement, unknown>;
  private isConnecting = false;
  private connectingFrom: string | null = null;
  private drag: any;

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.initCanvas();
    this.setupZoom();
    this.render();
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  private initCanvas(): void {
    const svgElement = this.canvasRef.nativeElement;
    this.svg = d3.select(svgElement);
    
    // Create main group for zoom/pan
    this.g = this.svg.append('g').attr('class', 'main-group');

    // Handle background clicks to cancel connection
    this.svg.on('click', (event) => {
      if (this.isConnecting && event.target === svgElement) {
        this.cancelConnection();
      }
    });

    // Add arrow marker for connections
    this.svg.append('defs').append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 15)
      .attr('refY', 0)
      .attr('markerWidth', 10)
      .attr('markerHeight', 10)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#9ca3af');
  }

  private setupZoom(): void {
    this.zoom = d3.zoom<SVGElement, unknown>()
      .scaleExtent([0.1, 3])
      .on('zoom', (event) => {
        this.g.attr('transform', event.transform.toString());
      });

    this.svg.call(this.zoom);
  }

  private render(): void {
    this.renderConnections();
    this.renderNodes();
  }

  private renderConnections(): void {
    // Remove old connections
    this.g.selectAll('.connection').remove();

    // Create connection group
    const connectionGroup = this.g.append('g').attr('class', 'connections');

    this.connectionElements = connectionGroup
      .selectAll<SVGPathElement, WorkflowConnection>('.connection')
      .data(this.connections, d => d.id)
      .enter()
      .append('path')
      .attr('class', d => `connection ${d.id === this.selectedNodeId ? 'selected' : ''}`)
      .attr('d', d => this.getConnectionPath(d))
      .on('click', (event, d) => {
        event.stopPropagation();
        // Could emit connection selection
      })
      .on('dblclick', (event, d) => {
        event.stopPropagation();
        this.connectionDeleted.emit(d.id);
      });

    // Update existing connections
    this.connectionElements
      .data(this.connections, d => d.id)
      .attr('d', d => this.getConnectionPath(d));
  }

  private renderNodes(): void {
    // Remove old nodes
    this.g.selectAll('.node').remove();

    // Create node group
    const nodeGroup = this.g.append('g').attr('class', 'nodes');

    this.nodeElements = nodeGroup
      .selectAll<SVGGElement, WorkflowNode>('.node')
      .data(this.nodes, d => d.id)
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${d.position.x}, ${d.position.y})`)
      .call(this.createDragBehavior());

    // Add node rectangle
    this.nodeElements
      .append('rect')
      .attr('class', d => `node-rect ${d.type} ${d.id === this.selectedNodeId ? 'selected' : ''}`)
      .attr('width', 150)
      .attr('height', 60)
      .attr('x', -75)
      .attr('y', -30);

    // Add node icon
    this.nodeElements
      .append('text')
      .attr('class', 'node-icon')
      .attr('x', -60)
      .attr('y', -5)
      .text(d => this.getNodeIcon(d.type));

    // Add node label
    this.nodeElements
      .append('text')
      .attr('class', 'node-text')
      .attr('x', -40)
      .attr('y', 5)
      .text(d => d.label);

    // Add connection points
    this.nodeElements.each((d, i, nodes) => {
      const nodeGroup = d3.select(nodes[i]);
      
      // Input point (left)
      nodeGroup.append('circle')
        .attr('class', 'connection-point input-point')
        .attr('cx', -75)
        .attr('cy', 0)
        .on('mousedown', (event: MouseEvent) => {
          event.stopPropagation();
          if (this.isConnecting && this.connectingFrom) {
            this.completeConnection(d.id, 'input');
          }
        });

      // Output point (right)
      nodeGroup.append('circle')
        .attr('class', 'connection-point output-point')
        .attr('cx', 75)
        .attr('cy', 0)
        .on('mousedown', (event: MouseEvent) => {
          event.stopPropagation();
          this.startConnection(d.id, 'output');
        });
    });

    // Node click handler
    this.nodeElements.on('click', (event, d) => {
      event.stopPropagation();
      this.nodeSelected.emit(d);
    });

    // Update existing nodes
    this.nodeElements
      .data(this.nodes, d => d.id)
      .attr('transform', d => `translate(${d.position.x}, ${d.position.y})`)
      .select('.node-rect')
      .attr('class', d => `node-rect ${d.type} ${d.id === this.selectedNodeId ? 'selected' : ''}`);
  }

  private createDragBehavior(): any {
    return d3.drag<SVGGElement, WorkflowNode>()
      .on('start', (event: any, d: WorkflowNode) => {
        d3.select(event.sourceEvent.target).raise();
      })
      .on('drag', (event: any, d: WorkflowNode) => {
        d.position.x += event.dx;
        d.position.y += event.dy;
        d3.select(event.sourceEvent.target.parentElement)
          .attr('transform', `translate(${d.position.x}, ${d.position.y})`);
        
        // Update connections when node moves
        this.updateConnections();
      })
      .on('end', (event: any, d: WorkflowNode) => {
        this.nodeMoved.emit({ nodeId: d.id, position: d.position });
      });
  }

  private getConnectionPath(connection: WorkflowConnection): string {
    const sourceNode = this.nodes.find(n => n.id === connection.source);
    const targetNode = this.nodes.find(n => n.id === connection.target);

    if (!sourceNode || !targetNode) {
      return '';
    }

    const x1 = sourceNode.position.x + 75; // Right side of source
    const y1 = sourceNode.position.y;
    const x2 = targetNode.position.x - 75; // Left side of target
    const y2 = targetNode.position.y;

    // Create curved path
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dr = Math.sqrt(dx * dx + dy * dy);
    const sweep = dx > 0 ? 1 : 0;

    return `M ${x1} ${y1} A ${dr} ${dr} 0 0 ${sweep} ${x2} ${y2}`;
  }

  private updateConnections(): void {
    if (this.connectionElements) {
      this.connectionElements.attr('d', d => this.getConnectionPath(d));
    }
  }

  private startConnection(nodeId: string, point: 'input' | 'output'): void {
    this.isConnecting = true;
    this.connectingFrom = nodeId;
    // Add visual feedback - could highlight connection points
    this.svg.style('cursor', 'crosshair');
  }

  private completeConnection(targetNodeId: string, point: 'input' | 'output'): void {
    if (!this.connectingFrom || this.connectingFrom === targetNodeId) {
      this.cancelConnection();
      return;
    }

    const connection: WorkflowConnection = {
      id: `conn-${Date.now()}`,
      source: this.connectingFrom,
      target: targetNodeId
    };

    this.connectionCreated.emit(connection);
    this.cancelConnection();
  }

  private cancelConnection(): void {
    this.isConnecting = false;
    this.connectingFrom = null;
    this.svg.style('cursor', 'grab');
  }

  private getNodeIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'input': '→',
      'output': '→',
      'mcp-tool': '⚙',
      'llm': '🧠',
      'condition': '?',
      'transform': '↻'
    };
    return icons[type] || '●';
  }

  zoomIn(): void {
    this.svg.transition().call(this.zoom.scaleBy, 1.2);
  }

  zoomOut(): void {
    this.svg.transition().call(this.zoom.scaleBy, 0.8);
  }

  resetView(): void {
    this.svg.transition().call(this.zoom.transform, d3.zoomIdentity);
  }
}

