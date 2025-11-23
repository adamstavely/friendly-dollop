export interface Dependency {
  toolId: string;
  dependsOnToolId: string;
  type: 'tool' | 'service' | 'model';
  required: boolean;
}

export interface DependencyNode {
  id: string;
  name: string;
  type: 'tool' | 'service' | 'model';
  status?: 'healthy' | 'unhealthy' | 'deprecated';
}

export interface DependencyEdge {
  source: string;
  target: string;
  type: string;
  required: boolean;
}

