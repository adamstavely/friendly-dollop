export type TransportType = 'stdio' | 'sse' | 'streamable-http';

export interface MCPServerConfig {
  type?: TransportType;
  command?: string;
  args?: string[];
  url?: string;
  env?: Record<string, string>;
}

export interface MCPConfig {
  mcpServers: Record<string, MCPServerConfig>;
}

export interface InspectorConnectionOptions {
  transport?: TransportType;
  serverUrl?: string;
  serverCommand?: string;
  serverArgs?: string;
  serverName?: string;
  config?: MCPConfig;
}

