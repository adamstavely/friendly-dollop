import { Injectable } from '@angular/core';
import { Tool, ToolVersion } from '../../../shared/models/tool.model';
import { MCPConfig, MCPServerConfig, TransportType, InspectorConnectionOptions } from '../../../shared/models/inspector.model';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class InspectorService {
  private readonly defaultInspectorUrl = 'http://localhost:6274';
  private readonly inspectorUrl = (environment as any).inspectorUrl || this.defaultInspectorUrl;

  /**
   * Detect transport type from tool deployment endpoint
   */
  detectTransportType(tool: Tool, version?: ToolVersion): TransportType | null {
    const targetVersion = version || this.getLatestVersion(tool);
    if (!targetVersion?.deployment?.endpoint) {
      return null;
    }

    const endpoint = targetVersion.deployment.endpoint.toLowerCase();
    
    if (endpoint.includes('/sse')) {
      return 'sse';
    }
    
    if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
      return 'streamable-http';
    }

    // Check if tool has command/args metadata (would need to be added to Tool model)
    // For now, assume HTTP if it's a URL
    return 'streamable-http';
  }

  /**
   * Generate MCP config from tool data
   */
  generateInspectorConfig(tool: Tool, version?: ToolVersion): MCPConfig | null {
    const targetVersion = version || this.getLatestVersion(tool);
    if (!targetVersion) {
      return null;
    }

    const transport = this.detectTransportType(tool, targetVersion);
    if (!transport) {
      return null;
    }

    const serverConfig: MCPServerConfig = {
      type: transport
    };

    if (transport === 'sse' || transport === 'streamable-http') {
      if (!targetVersion.deployment?.endpoint) {
        return null;
      }
      serverConfig.url = targetVersion.deployment.endpoint;
    } else if (transport === 'stdio') {
      // STDIO requires command and args - these would need to be in tool metadata
      // For now, return null if we can't determine
      return null;
    }

    const serverName = tool.toolId || 'default-server';

    return {
      mcpServers: {
        [serverName]: serverConfig
      }
    };
  }

  /**
   * Generate Inspector URL with query parameters
   */
  getInspectorUrl(options: InspectorConnectionOptions): string {
    const baseUrl = this.inspectorUrl;
    const params = new URLSearchParams();

    if (options.transport) {
      params.append('transport', options.transport);
    }

    if (options.serverUrl) {
      params.append('serverUrl', options.serverUrl);
    }

    if (options.serverCommand) {
      params.append('serverCommand', options.serverCommand);
    }

    if (options.serverArgs) {
      params.append('serverArgs', options.serverArgs);
    }

    const queryString = params.toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  }

  /**
   * Launch Inspector for a specific tool
   */
  launchInspectorForTool(tool: Tool, version?: ToolVersion, transport?: TransportType): void {
    const targetVersion = version || this.getLatestVersion(tool);
    if (!targetVersion) {
      console.error('No version available for tool:', tool.toolId);
      return;
    }

    const detectedTransport = transport || this.detectTransportType(tool, targetVersion);
    if (!detectedTransport) {
      console.error('Could not detect transport type for tool:', tool.toolId);
      return;
    }

    const endpoint = targetVersion.deployment?.endpoint;
    if (!endpoint && (detectedTransport === 'sse' || detectedTransport === 'streamable-http')) {
      console.error('No endpoint available for tool:', tool.toolId);
      return;
    }

    const options: InspectorConnectionOptions = {
      transport: detectedTransport,
      serverUrl: endpoint,
      serverName: tool.toolId
    };

    const url = this.getInspectorUrl(options);
    window.open(url, '_blank');
  }

  /**
   * Download config file for CLI usage
   */
  downloadConfigFile(config: MCPConfig, filename: string = 'mcp.json'): void {
    const jsonStr = JSON.stringify(config, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Get connection options from tool
   */
  getConnectionOptions(tool: Tool, version?: ToolVersion): InspectorConnectionOptions | null {
    const targetVersion = version || this.getLatestVersion(tool);
    if (!targetVersion) {
      return null;
    }

    const transport = this.detectTransportType(tool, targetVersion);
    if (!transport) {
      return null;
    }

    const options: InspectorConnectionOptions = {
      transport,
      serverName: tool.toolId
    };

    if (transport === 'sse' || transport === 'streamable-http') {
      options.serverUrl = targetVersion.deployment?.endpoint;
    } else if (transport === 'stdio') {
      // STDIO would need command/args from tool metadata
      // This is a placeholder for future enhancement
      return null;
    }

    return options;
  }

  /**
   * Check if tool can be inspected (has valid endpoint/connection info)
   */
  canInspectTool(tool: Tool, version?: ToolVersion): boolean {
    const targetVersion = version || this.getLatestVersion(tool);
    if (!targetVersion) {
      return false;
    }

    const transport = this.detectTransportType(tool, targetVersion);
    if (!transport) {
      return false;
    }

    if (transport === 'sse' || transport === 'streamable-http') {
      return !!targetVersion.deployment?.endpoint;
    }

    // STDIO would need command/args
    return false;
  }

  /**
   * Get latest version from tool
   */
  private getLatestVersion(tool: Tool): ToolVersion | null {
    if (!tool.versions || tool.versions.length === 0) {
      return null;
    }
    // Return the last version (assuming they're ordered)
    return tool.versions[tool.versions.length - 1];
  }
}

