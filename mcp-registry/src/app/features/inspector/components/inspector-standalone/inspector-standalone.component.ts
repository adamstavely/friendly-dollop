import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { InspectorService } from '../../services/inspector.service';
import { TransportType, MCPConfig } from '../../../../shared/models/inspector.model';

@Component({
  selector: 'app-inspector-standalone',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatSnackBarModule
  ],
  template: `
    <div class="inspector-standalone-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>MCP Inspector</mat-card-title>
          <mat-card-subtitle>Test and inspect MCP servers</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <mat-tab-group>
            <mat-tab label="Quick Connect">
              <div class="tab-content">
                <form [formGroup]="quickConnectForm" (ngSubmit)="onQuickConnect()">
                  <mat-form-field appearance="outline">
                    <mat-label>Transport Type</mat-label>
                    <mat-select formControlName="transport">
                      <mat-option value="sse">SSE (Server-Sent Events)</mat-option>
                      <mat-option value="streamable-http">Streamable HTTP</mat-option>
                      <mat-option value="stdio">STDIO</mat-option>
                    </mat-select>
                  </mat-form-field>

                  <mat-form-field 
                    appearance="outline" 
                    *ngIf="quickConnectForm.get('transport')?.value !== 'stdio'">
                    <mat-label>Server URL</mat-label>
                    <input matInput formControlName="serverUrl" placeholder="http://localhost:3000/sse">
                    <mat-hint>Enter the MCP server endpoint URL</mat-hint>
                  </mat-form-field>

                  <mat-form-field 
                    appearance="outline" 
                    *ngIf="quickConnectForm.get('transport')?.value === 'stdio'">
                    <mat-label>Command</mat-label>
                    <input matInput formControlName="serverCommand" placeholder="npx">
                    <mat-hint>Command to run the MCP server</mat-hint>
                  </mat-form-field>

                  <mat-form-field 
                    appearance="outline" 
                    *ngIf="quickConnectForm.get('transport')?.value === 'stdio'">
                    <mat-label>Arguments</mat-label>
                    <input matInput formControlName="serverArgs" placeholder="@modelcontextprotocol/server-everything">
                    <mat-hint>Space-separated arguments for the command</mat-hint>
                  </mat-form-field>

                  <div class="form-actions">
                    <button 
                      mat-raised-button 
                      color="primary" 
                      type="submit"
                      [disabled]="!quickConnectForm.valid">
                      <mat-icon>open_in_new</mat-icon>
                      Launch Inspector
                    </button>
                  </div>
                </form>
              </div>
            </mat-tab>

            <mat-tab label="Config File">
              <div class="tab-content">
                <div class="config-section">
                  <h3>Upload Config File</h3>
                  <input 
                    type="file" 
                    accept=".json" 
                    (change)="onConfigFileSelected($event)"
                    #fileInput
                    style="display: none">
                  <button 
                    mat-stroked-button 
                    (click)="fileInput.click()">
                    <mat-icon>upload_file</mat-icon>
                    Choose Config File
                  </button>
                  <p *ngIf="uploadedConfig" class="config-status">
                    Config loaded: {{ uploadedConfigFileName }}
                  </p>
                </div>

                <div class="config-section">
                  <h3>Or Create Config Manually</h3>
                  <form [formGroup]="configForm" (ngSubmit)="onConfigSubmit()">
                    <mat-form-field appearance="outline">
                      <mat-label>Server Name</mat-label>
                      <input matInput formControlName="serverName" placeholder="my-server">
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>Transport Type</mat-label>
                      <mat-select formControlName="transport">
                        <mat-option value="sse">SSE</mat-option>
                        <mat-option value="streamable-http">Streamable HTTP</mat-option>
                        <mat-option value="stdio">STDIO</mat-option>
                      </mat-select>
                    </mat-form-field>

                    <mat-form-field 
                      appearance="outline" 
                      *ngIf="configForm.get('transport')?.value !== 'stdio'">
                      <mat-label>URL</mat-label>
                      <input matInput formControlName="url" placeholder="http://localhost:3000/sse">
                    </mat-form-field>

                    <mat-form-field 
                      appearance="outline" 
                      *ngIf="configForm.get('transport')?.value === 'stdio'">
                      <mat-label>Command</mat-label>
                      <input matInput formControlName="command" placeholder="npx">
                    </mat-form-field>

                    <mat-form-field 
                      appearance="outline" 
                      *ngIf="configForm.get('transport')?.value === 'stdio'">
                      <mat-label>Arguments (comma-separated)</mat-label>
                      <input matInput formControlName="args" placeholder="@modelcontextprotocol/server-everything">
                    </mat-form-field>

                    <div class="form-actions">
                      <button 
                        mat-raised-button 
                        color="primary" 
                        type="submit"
                        [disabled]="!configForm.valid">
                        <mat-icon>open_in_new</mat-icon>
                        Launch with Config
                      </button>
                      <button 
                        mat-stroked-button 
                        type="button"
                        (click)="downloadGeneratedConfig()"
                        [disabled]="!configForm.valid">
                        <mat-icon>download</mat-icon>
                        Download Config
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </mat-tab>
          </mat-tab-group>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .inspector-standalone-container {
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
    }
    .tab-content {
      padding: 24px;
    }
    mat-form-field {
      width: 100%;
      margin-bottom: 16px;
    }
    .form-actions {
      display: flex;
      gap: 12px;
      margin-top: 24px;
    }
    .config-section {
      margin-bottom: 32px;
    }
    .config-section h3 {
      margin-bottom: 16px;
      color: #333;
    }
    .config-status {
      margin-top: 12px;
      padding: 8px;
      background: #e8f5e9;
      border-radius: 4px;
      color: #2e7d32;
    }
  `]
})
export class InspectorStandaloneComponent implements OnInit {
  quickConnectForm: FormGroup;
  configForm: FormGroup;
  uploadedConfig: MCPConfig | null = null;
  uploadedConfigFileName: string = '';

  constructor(
    private fb: FormBuilder,
    private inspectorService: InspectorService,
    private snackBar: MatSnackBar
  ) {
    this.quickConnectForm = this.fb.group({
      transport: ['sse', Validators.required],
      serverUrl: [''],
      serverCommand: [''],
      serverArgs: ['']
    });

    this.configForm = this.fb.group({
      serverName: ['default-server', Validators.required],
      transport: ['sse', Validators.required],
      url: [''],
      command: [''],
      args: ['']
    });

    // Update validators based on transport type
    this.quickConnectForm.get('transport')?.valueChanges.subscribe(transport => {
      if (transport === 'stdio') {
        this.quickConnectForm.get('serverUrl')?.clearValidators();
        this.quickConnectForm.get('serverCommand')?.setValidators([Validators.required]);
        this.quickConnectForm.get('serverArgs')?.setValidators([Validators.required]);
      } else {
        this.quickConnectForm.get('serverUrl')?.setValidators([Validators.required]);
        this.quickConnectForm.get('serverCommand')?.clearValidators();
        this.quickConnectForm.get('serverArgs')?.clearValidators();
      }
      this.quickConnectForm.get('serverUrl')?.updateValueAndValidity();
      this.quickConnectForm.get('serverCommand')?.updateValueAndValidity();
      this.quickConnectForm.get('serverArgs')?.updateValueAndValidity();
    });

    this.configForm.get('transport')?.valueChanges.subscribe(transport => {
      if (transport === 'stdio') {
        this.configForm.get('url')?.clearValidators();
        this.configForm.get('command')?.setValidators([Validators.required]);
        this.configForm.get('args')?.clearValidators();
      } else {
        this.configForm.get('url')?.setValidators([Validators.required]);
        this.configForm.get('command')?.clearValidators();
        this.configForm.get('args')?.clearValidators();
      }
      this.configForm.get('url')?.updateValueAndValidity();
      this.configForm.get('command')?.updateValueAndValidity();
      this.configForm.get('args')?.updateValueAndValidity();
    });
  }

  ngOnInit(): void {
    // Check for query parameters
    const params = new URLSearchParams(window.location.search);
    const transport = params.get('transport') as TransportType | null;
    const serverUrl = params.get('serverUrl');
    const serverCommand = params.get('serverCommand');
    const serverArgs = params.get('serverArgs');

    if (transport && (serverUrl || (serverCommand && serverArgs))) {
      if (transport === 'stdio' && serverCommand && serverArgs) {
        this.quickConnectForm.patchValue({
          transport,
          serverCommand,
          serverArgs
        });
      } else if (serverUrl) {
        this.quickConnectForm.patchValue({
          transport,
          serverUrl
        });
      }
      // Auto-launch if params are present
      setTimeout(() => this.onQuickConnect(), 500);
    }
  }

  onQuickConnect(): void {
    if (!this.quickConnectForm.valid) {
      return;
    }

    const formValue = this.quickConnectForm.value;
    const url = this.inspectorService.getInspectorUrl({
      transport: formValue.transport,
      serverUrl: formValue.serverUrl,
      serverCommand: formValue.serverCommand,
      serverArgs: formValue.serverArgs
    });

    window.open(url, '_blank');
    this.snackBar.open('Opening Inspector in new tab...', 'Close', {
      duration: 3000
    });
  }

  onConfigFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    this.uploadedConfigFileName = file.name;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const config = JSON.parse(content) as MCPConfig;
        this.uploadedConfig = config;
        
        // Launch Inspector with uploaded config
        const serverName = Object.keys(config.mcpServers || {})[0] || 'default-server';
        const serverConfig = config.mcpServers?.[serverName];
        
        if (serverConfig) {
          const url = this.inspectorService.getInspectorUrl({
            transport: serverConfig.type,
            serverUrl: serverConfig.url,
            serverCommand: serverConfig.command,
            serverArgs: serverConfig.args?.join(' ')
          });
          
          window.open(url, '_blank');
          this.snackBar.open('Opening Inspector with uploaded config...', 'Close', {
            duration: 3000
          });
        }
      } catch (error) {
        console.error('Error parsing config file:', error);
        this.snackBar.open('Invalid config file format', 'Close', {
          duration: 5000
        });
      }
    };
    reader.readAsText(file);
  }

  onConfigSubmit(): void {
    if (!this.configForm.valid) {
      return;
    }

    const formValue = this.configForm.value;
    const config: MCPConfig = {
      mcpServers: {
        [formValue.serverName]: {
          type: formValue.transport,
          url: formValue.url || undefined,
          command: formValue.command || undefined,
          args: formValue.args ? formValue.args.split(',').map((a: string) => a.trim()) : undefined
        }
      }
    };

    const url = this.inspectorService.getInspectorUrl({
      transport: formValue.transport,
      serverUrl: formValue.url,
      serverCommand: formValue.command,
      serverArgs: formValue.args
    });

    window.open(url, '_blank');
    this.snackBar.open('Opening Inspector with config...', 'Close', {
      duration: 3000
    });
  }

  downloadGeneratedConfig(): void {
    if (!this.configForm.valid) {
      return;
    }

    const formValue = this.configForm.value;
    const config: MCPConfig = {
      mcpServers: {
        [formValue.serverName]: {
          type: formValue.transport,
          url: formValue.url || undefined,
          command: formValue.command || undefined,
          args: formValue.args ? formValue.args.split(',').map((a: string) => a.trim()) : undefined
        }
      }
    };

    this.inspectorService.downloadConfigFile(config, `${formValue.serverName}-mcp-config.json`);
    this.snackBar.open('Config file downloaded', 'Close', {
      duration: 3000
    });
  }
}

