import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { GitOpsService } from '../../services/gitops.service';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { YamlTemplateGeneratorComponent, TemplateGeneratorData } from '../yaml-template-generator/yaml-template-generator.component';
import { YamlDiffViewerComponent } from '../yaml-diff-viewer/yaml-diff-viewer.component';
import { YamlFileSelectorComponent, SavedFile, FileSelectorData } from '../yaml-file-selector/yaml-file-selector.component';
import { Tool } from '../../../../shared/models/tool.model';
import { MonacoService } from '../../../../core/services/monaco.service';
import { ToastService } from '../../../../core/services/toast.service';
import { load as yamlLoad } from 'js-yaml';
import Ajv from 'ajv/dist/2020';

declare var monaco: any;

@Component({
  selector: 'app-yaml-editor',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatMenuModule,
    MatTooltipModule,
    MatDividerModule,
    LoadingSpinnerComponent
  ],
  template: `
    <div class="yaml-editor">
      <mat-card>
        <mat-card-header>
          <mat-card-title>YAML Editor</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="editor-toolbar">
            <button mat-raised-button color="primary" (click)="validateYaml()" matTooltip="Validate YAML syntax and schema">
              <mat-icon>check_circle</mat-icon>
              Validate
            </button>
            <button mat-raised-button (click)="formatYaml()" matTooltip="Format YAML document">
              <mat-icon>format_align_left</mat-icon>
              Format
            </button>
            <button mat-raised-button [matMenuTriggerFor]="templateMenu" matTooltip="Generate or load YAML template">
              <mat-icon>file_copy</mat-icon>
              Templates
              <mat-icon>arrow_drop_down</mat-icon>
            </button>
            <button mat-raised-button [matMenuTriggerFor]="fileMenu" matTooltip="Import or export YAML files">
              <mat-icon>folder</mat-icon>
              Files
              <mat-icon>arrow_drop_down</mat-icon>
            </button>
            <button mat-raised-button (click)="openDiffViewer()" matTooltip="Compare YAML files">
              <mat-icon>compare</mat-icon>
              Diff
            </button>
            <button mat-raised-button (click)="undo()" [disabled]="!canUndo()" matTooltip="Undo (Ctrl+Z)">
              <mat-icon>undo</mat-icon>
            </button>
            <button mat-raised-button (click)="redo()" [disabled]="!canRedo()" matTooltip="Redo (Ctrl+Y)">
              <mat-icon>redo</mat-icon>
            </button>
            <button mat-raised-button (click)="copyToClipboard()" matTooltip="Copy to clipboard">
              <mat-icon>content_copy</mat-icon>
            </button>
          </div>
          
          <mat-menu #templateMenu="matMenu">
            <button mat-menu-item (click)="openTemplateGenerator()">
              <mat-icon>add_circle</mat-icon>
              <span>Generate Template</span>
            </button>
            <button mat-menu-item (click)="loadTemplate()">
              <mat-icon>insert_drive_file</mat-icon>
              <span>Load Default Template</span>
            </button>
          </mat-menu>

          <mat-menu #fileMenu="matMenu">
            <button mat-menu-item (click)="importYaml()">
              <mat-icon>upload_file</mat-icon>
              <span>Import YAML</span>
            </button>
            <button mat-menu-item (click)="exportYaml()">
              <mat-icon>download</mat-icon>
              <span>Export YAML</span>
            </button>
            <button mat-menu-item (click)="exportToJson()">
              <mat-icon>code</mat-icon>
              <span>Export to JSON</span>
            </button>
            <mat-divider></mat-divider>
            <button mat-menu-item (click)="saveToLocalStorage()">
              <mat-icon>save</mat-icon>
              <span>Save to Browser</span>
            </button>
            <button mat-menu-item (click)="loadFromLocalStorage()">
              <mat-icon>folder_open</mat-icon>
              <span>Load from Browser</span>
            </button>
          </mat-menu>

          <div #editorContainer class="editor-container"></div>
          
          <div *ngIf="validationErrors.length > 0" class="validation-errors">
            <h4>Validation Errors:</h4>
            <mat-chip *ngFor="let error of validationErrors" class="error-chip">
              {{ error }}
            </mat-chip>
          </div>
          <div *ngIf="validationSuccess" class="validation-success">
            <mat-chip class="success-chip">✓ YAML is valid</mat-chip>
          </div>
          
          <div *ngIf="schemaValidationErrors.length > 0" class="validation-errors">
            <h4>Schema Validation Errors:</h4>
            <mat-chip *ngFor="let error of schemaValidationErrors" class="error-chip">
              {{ error }}
            </mat-chip>
          </div>
          
          <input type="file" accept=".yaml,.yml" #fileInput style="display: none" (change)="onFileSelected($event)">
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .yaml-editor {
      padding: 20px;
    }
    .editor-toolbar {
      display: flex;
      gap: 8px;
      margin-bottom: 16px;
    }
    .editor-container {
      width: 100%;
      height: 500px;
      border: 1px solid #ccc;
    }
    .validation-errors {
      margin-top: 16px;
      padding: 16px;
      background: #ffebee;
      border-radius: 4px;
    }
    .validation-success {
      margin-top: 16px;
    }
    .error-chip {
      background-color: #f44336;
      color: white;
      margin: 4px;
    }
    .success-chip {
      background-color: #4caf50;
      color: white;
    }
  `]
})
export class YamlEditorComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('editorContainer', { static: false }) editorContainer!: ElementRef;
  @ViewChild('fileInput', { static: false }) fileInput!: ElementRef;
  
  editor: any;
  yamlContent: string = '';
  validationErrors: string[] = [];
  schemaValidationErrors: string[] = [];
  validationSuccess: boolean = false;
  private disposables: any[] = [];
  private yamlSchema: any = null;
  private ajv: Ajv;
  private validateDebounceTimer: any = null;

  constructor(
    private gitOpsService: GitOpsService,
    private dialog: MatDialog,
    private monacoService: MonacoService,
    private toastService: ToastService
  ) {
    this.ajv = new Ajv({ allErrors: true, verbose: true });
  }

  ngOnInit(): void {
    this.loadTemplate();
  }

  async ngAfterViewInit(): Promise<void> {
    // Wait for Monaco YAML to be initialized
    await this.monacoService.waitForInitialization();
    this.initializeEditor();
  }

  initializeEditor(): void {
    if (typeof monaco === 'undefined') {
      console.error('Monaco Editor not loaded');
      return;
    }

    this.editor = monaco.editor.create(this.editorContainer.nativeElement, {
      value: this.yamlContent,
      language: 'yaml',
      theme: 'vs',
      automaticLayout: true,
      minimap: { enabled: true },
      suggestOnTriggerCharacters: true,
      quickSuggestions: true,
      formatOnPaste: true,
      formatOnType: true
    });

    // Setup auto-completion
    this.setupAutoCompletion();
    
    // Setup schema validation
    this.setupSchemaValidation();

    const contentChangeDisposable = this.editor.onDidChangeModelContent(() => {
      this.validationSuccess = false;
      this.validationErrors = [];
      this.schemaValidationErrors = [];
      
      // Real-time validation with debounce
      if (this.validateDebounceTimer) {
        clearTimeout(this.validateDebounceTimer);
      }
      this.validateDebounceTimer = setTimeout(() => {
        this.validateSchema(this.editor.getValue());
      }, 500); // Debounce for 500ms
    });
    this.disposables.push(contentChangeDisposable);
  }

  setupAutoCompletion(): void {
    if (typeof monaco === 'undefined' || !monaco.languages) {
      return;
    }

    // Register completion provider for YAML
    const completionProvider = monaco.languages.registerCompletionItemProvider('yaml', {
      provideCompletionItems: (model: any, position: any) => {
        const suggestions = this.getCompletionSuggestions(model, position);
        return { suggestions };
      }
    });
    this.disposables.push(completionProvider);
  }

  getCompletionSuggestions(model: any, position: any): any[] {
    const lineContent = model.getLineContent(position.lineNumber);
    const textUntilPosition = model.getValueInRange({
      startLineNumber: 1,
      startColumn: 1,
      endLineNumber: position.lineNumber,
      endColumn: position.column
    });

    const suggestions: any[] = [];
    const word = model.getWordUntilPosition(position);
    const range = {
      startLineNumber: position.lineNumber,
      endLineNumber: position.lineNumber,
      startColumn: word.startColumn,
      endColumn: word.endColumn
    };

    // Detect context - are we inside a nested structure?
    const indentLevel = lineContent.match(/^(\s*)/)?.[1]?.length || 0;
    const isInRateLimits = this.isInContext(textUntilPosition, 'rateLimits', indentLevel);
    const isInVersions = this.isInContext(textUntilPosition, 'versions', indentLevel);
    const isInDependencyGraph = this.isInContext(textUntilPosition, 'dependencyGraph', indentLevel);
    const isInGitOpsSource = this.isInContext(textUntilPosition, 'gitOpsSource', indentLevel);
    const isInRetirementPlan = this.isInContext(textUntilPosition, 'retirementPlan', indentLevel);

    // Tool definition completions
    const toolProperties = [
      { label: 'toolId', kind: monaco.languages.CompletionItemKind.Property, detail: 'Unique tool identifier', insertText: 'toolId: "$1"' },
      { label: 'name', kind: monaco.languages.CompletionItemKind.Property, detail: 'Tool name', insertText: 'name: "$1"' },
      { label: 'description', kind: monaco.languages.CompletionItemKind.Property, detail: 'Tool description', insertText: 'description: "$1"' },
      { label: 'domain', kind: monaco.languages.CompletionItemKind.Property, detail: 'Tool domain', insertText: 'domain: "$1"' },
      { label: 'capabilities', kind: monaco.languages.CompletionItemKind.Property, detail: 'List of capabilities', insertText: 'capabilities:\n  - "$1"' },
      { label: 'ownerTeam', kind: monaco.languages.CompletionItemKind.Property, detail: 'Owner team', insertText: 'ownerTeam: "$1"' },
      { label: 'contact', kind: monaco.languages.CompletionItemKind.Property, detail: 'Contact email', insertText: 'contact: "$1"' },
      { label: 'securityClass', kind: monaco.languages.CompletionItemKind.Property, detail: 'Security classification', insertText: 'securityClass: $1' },
      { label: 'lifecycleState', kind: monaco.languages.CompletionItemKind.Property, detail: 'Lifecycle state', insertText: 'lifecycleState: $1' },
      { label: 'tags', kind: monaco.languages.CompletionItemKind.Property, detail: 'List of tags', insertText: 'tags:\n  - "$1"' },
      { label: 'rateLimits', kind: monaco.languages.CompletionItemKind.Property, detail: 'Rate limit configuration', insertText: 'rateLimits:\n  maxPerMinute: $1\n  maxConcurrency: $2\n  timeoutMs: $3\n  retryPolicy: $4' },
      { label: 'versions', kind: monaco.languages.CompletionItemKind.Property, detail: 'Tool versions', insertText: 'versions:\n  - version: "$1"\n    schema: {}\n    deprecated: false' },
      { label: 'dependencyGraph', kind: monaco.languages.CompletionItemKind.Property, detail: 'Dependency graph', insertText: 'dependencyGraph:\n  dependsOnTools: []\n  dependsOnServices: []\n  modelDependencies: []' },
      { label: 'gitOpsSource', kind: monaco.languages.CompletionItemKind.Property, detail: 'GitOps source', insertText: 'gitOpsSource:\n  repo: "$1"\n  commit: "$2"\n  branch: "$3"' },
      { label: 'retirementPlan', kind: monaco.languages.CompletionItemKind.Property, detail: 'Retirement plan', insertText: 'retirementPlan:\n  autoSunset: $1\n  retirementDate: "$2"\n  replacementToolId: "$3"' },
      { label: 'policyRef', kind: monaco.languages.CompletionItemKind.Property, detail: 'Policy reference', insertText: 'policyRef: "$1"' },
      { label: 'qualityScore', kind: monaco.languages.CompletionItemKind.Property, detail: 'Quality score (0-100)', insertText: 'qualityScore: $1' }
    ];

    // Security class values
    const securityClassValues = [
      { label: 'public', kind: monaco.languages.CompletionItemKind.Value, detail: 'Public security class' },
      { label: 'internal', kind: monaco.languages.CompletionItemKind.Value, detail: 'Internal security class' },
      { label: 'restricted', kind: monaco.languages.CompletionItemKind.Value, detail: 'Restricted security class' },
      { label: 'highly-restricted', kind: monaco.languages.CompletionItemKind.Value, detail: 'Highly restricted security class' }
    ];

    // Lifecycle state values
    const lifecycleStateValues = [
      { label: 'development', kind: monaco.languages.CompletionItemKind.Value, detail: 'Development state' },
      { label: 'staging', kind: monaco.languages.CompletionItemKind.Value, detail: 'Staging state' },
      { label: 'pilot', kind: monaco.languages.CompletionItemKind.Value, detail: 'Pilot state' },
      { label: 'production', kind: monaco.languages.CompletionItemKind.Value, detail: 'Production state' },
      { label: 'deprecated', kind: monaco.languages.CompletionItemKind.Value, detail: 'Deprecated state' },
      { label: 'retired', kind: monaco.languages.CompletionItemKind.Value, detail: 'Retired state' }
    ];

    // Check if we're in a property context
    const isPropertyContext = !lineContent.includes(':') || lineContent.trim().endsWith(':');
    const isValueContext = lineContent.includes(':') && !lineContent.trim().endsWith(':');

    if (isPropertyContext) {
      // Context-aware property suggestions
      if (isInRateLimits) {
        const rateLimitProperties = [
          { label: 'maxPerMinute', detail: 'Maximum requests per minute', insertText: 'maxPerMinute: $1' },
          { label: 'maxConcurrency', detail: 'Maximum concurrent requests', insertText: 'maxConcurrency: $1' },
          { label: 'timeoutMs', detail: 'Timeout in milliseconds', insertText: 'timeoutMs: $1' },
          { label: 'retryPolicy', detail: 'Retry policy (exponential/linear/fixed)', insertText: 'retryPolicy: $1' }
        ];
        rateLimitProperties.forEach(prop => {
          if (prop.label.toLowerCase().includes(word.word.toLowerCase()) || !word.word) {
            suggestions.push({
              label: prop.label,
              kind: monaco.languages.CompletionItemKind.Property,
              detail: prop.detail,
              insertText: prop.insertText,
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              range
            });
          }
        });
      } else if (isInVersions) {
        const versionProperties = [
          { label: 'version', detail: 'Version string', insertText: 'version: "$1"' },
          { label: 'schema', detail: 'MCP schema JSON', insertText: 'schema: {}\n    $1' },
          { label: 'deprecated', detail: 'Whether version is deprecated', insertText: 'deprecated: $1' },
          { label: 'deployment', detail: 'Deployment configuration', insertText: 'deployment:\n      env: $1\n      endpoint: "$2"' },
          { label: 'health', detail: 'Health check status', insertText: 'health:\n      lastCheck: "$1"\n      status: $2' }
        ];
        versionProperties.forEach(prop => {
          if (prop.label.toLowerCase().includes(word.word.toLowerCase()) || !word.word) {
            suggestions.push({
              label: prop.label,
              kind: monaco.languages.CompletionItemKind.Property,
              detail: prop.detail,
              insertText: prop.insertText,
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              range
            });
          }
        });
      } else if (isInDependencyGraph) {
        const dependencyProperties = [
          { label: 'dependsOnTools', detail: 'List of tool dependencies', insertText: 'dependsOnTools:\n    - "$1"' },
          { label: 'dependsOnServices', detail: 'List of service dependencies', insertText: 'dependsOnServices:\n    - "$1"' },
          { label: 'modelDependencies', detail: 'List of model dependencies', insertText: 'modelDependencies:\n    - "$1"' }
        ];
        dependencyProperties.forEach(prop => {
          if (prop.label.toLowerCase().includes(word.word.toLowerCase()) || !word.word) {
            suggestions.push({
              label: prop.label,
              kind: monaco.languages.CompletionItemKind.Property,
              detail: prop.detail,
              insertText: prop.insertText,
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              range
            });
          }
        });
      } else if (isInGitOpsSource) {
        const gitOpsProperties = [
          { label: 'repo', detail: 'Repository URL', insertText: 'repo: "$1"' },
          { label: 'commit', detail: 'Commit hash', insertText: 'commit: "$1"' },
          { label: 'branch', detail: 'Branch name', insertText: 'branch: "$1"' }
        ];
        gitOpsProperties.forEach(prop => {
          if (prop.label.toLowerCase().includes(word.word.toLowerCase()) || !word.word) {
            suggestions.push({
              label: prop.label,
              kind: monaco.languages.CompletionItemKind.Property,
              detail: prop.detail,
              insertText: prop.insertText,
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              range
            });
          }
        });
      } else if (isInRetirementPlan) {
        const retirementProperties = [
          { label: 'autoSunset', detail: 'Auto sunset enabled', insertText: 'autoSunset: $1' },
          { label: 'retirementDate', detail: 'Retirement date', insertText: 'retirementDate: "$1"' },
          { label: 'replacementToolId', detail: 'Replacement tool ID', insertText: 'replacementToolId: "$1"' }
        ];
        retirementProperties.forEach(prop => {
          if (prop.label.toLowerCase().includes(word.word.toLowerCase()) || !word.word) {
            suggestions.push({
              label: prop.label,
              kind: monaco.languages.CompletionItemKind.Property,
              detail: prop.detail,
              insertText: prop.insertText,
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              range
            });
          }
        });
      } else {
        // Top-level properties
        toolProperties.forEach(prop => {
          if (prop.label.toLowerCase().includes(word.word.toLowerCase()) || !word.word) {
            suggestions.push({
              label: prop.label,
              kind: prop.kind,
              detail: prop.detail,
              insertText: prop.insertText,
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              range
            });
          }
        });
      }
    } else if (isValueContext) {
      // Check what property we're completing
      if (lineContent.includes('securityClass')) {
        securityClassValues.forEach(val => {
          if (val.label.toLowerCase().includes(word.word.toLowerCase()) || !word.word) {
            suggestions.push({
              label: val.label,
              kind: val.kind,
              detail: val.detail,
              range
            });
          }
        });
      } else if (lineContent.includes('lifecycleState')) {
        lifecycleStateValues.forEach(val => {
          if (val.label.toLowerCase().includes(word.word.toLowerCase()) || !word.word) {
            suggestions.push({
              label: val.label,
              kind: val.kind,
              detail: val.detail,
              range
            });
          }
        });
      } else if (lineContent.includes('retryPolicy')) {
        const retryPolicyValues = [
          { label: 'exponential', detail: 'Exponential backoff' },
          { label: 'linear', detail: 'Linear backoff' },
          { label: 'fixed', detail: 'Fixed delay' }
        ];
        retryPolicyValues.forEach(val => {
          if (val.label.toLowerCase().includes(word.word.toLowerCase()) || !word.word) {
            suggestions.push({
              label: val.label,
              kind: monaco.languages.CompletionItemKind.Value,
              detail: val.detail,
              range
            });
          }
        });
      }
    }

    return suggestions;
  }

  private isInContext(text: string, contextName: string, currentIndent: number): boolean {
    // Check if we're inside a specific context by looking for the context name
    // and checking if current line has more indentation
    const contextRegex = new RegExp(`^\\s*${contextName}\\s*:`, 'm');
    const matches = text.match(contextRegex);
    if (!matches) return false;
    
    // Check if current indent is greater than the context indent
    const contextIndent = matches[0].match(/^(\s*)/)?.[1]?.length || 0;
    return currentIndent > contextIndent;
  }

  setupSchemaValidation(): void {
    if (typeof monaco === 'undefined') {
      return;
    }

    // Load tool schema
    this.gitOpsService.getToolSchema().subscribe({
      next: (schema: any) => {
        this.yamlSchema = schema;
        this.registerSchema(schema);
      },
      error: (err: any) => {
        console.warn('Could not load tool schema, using default validation:', err);
        // Use a basic schema if the service fails
        this.registerDefaultSchema();
      }
    });
  }

  registerSchema(schema: any): void {
    // Use MonacoService to register schema
    this.monacoService.registerYamlSchema(
      'http://mcp-registry/schemas/tool.yaml',
      schema,
      ['*']
    );
  }

  registerDefaultSchema(): void {
    const defaultSchema = {
      type: 'object',
      properties: {
        toolId: { type: 'string' },
        name: { type: 'string' },
        description: { type: 'string' },
        domain: { type: 'string' },
        capabilities: { type: 'array', items: { type: 'string' } },
        ownerTeam: { type: 'string' },
        contact: { type: 'string' },
        securityClass: { 
          type: 'string', 
          enum: ['public', 'internal', 'restricted', 'highly-restricted'] 
        },
        lifecycleState: { 
          type: 'string', 
          enum: ['development', 'staging', 'pilot', 'production', 'deprecated', 'retired'] 
        },
        tags: { type: 'array', items: { type: 'string' } },
        rateLimits: {
          type: 'object',
          properties: {
            maxPerMinute: { type: 'number' },
            maxConcurrency: { type: 'number' },
            timeoutMs: { type: 'number' },
            retryPolicy: { 
              type: 'string', 
              enum: ['exponential', 'linear', 'fixed'] 
            }
          }
        }
      },
      required: ['toolId', 'name']
    };
    this.registerSchema(defaultSchema);
  }

  loadTemplate(): void {
    this.yamlContent = `toolId: ""
name: ""
description: ""
domain: ""
capabilities: []
ownerTeam: ""
contact: ""
securityClass: internal
lifecycleState: development
tags: []
rateLimits:
  maxPerMinute: 100
  maxConcurrency: 5
  timeoutMs: 30000
  retryPolicy: exponential
`;
    if (this.editor) {
      this.editor.setValue(this.yamlContent);
    }
  }

  validateYaml(): void {
    const content = this.editor ? this.editor.getValue() : this.yamlContent;
    
    // Basic YAML syntax validation
    this.gitOpsService.validateYaml(content).subscribe({
      next: (result: any) => {
        if (result.valid) {
          this.validationSuccess = true;
          this.validationErrors = [];
        } else {
          this.validationSuccess = false;
          this.validationErrors = result.errors || ['Validation failed'];
        }
        
        // Schema validation
        this.validateSchema(content);
      },
      error: (err: any) => {
        this.validationSuccess = false;
        this.validationErrors = [err.message || 'Validation error'];
      }
    });
  }

  validateSchema(content: string): void {
    if (!this.yamlSchema) {
      return;
    }

    try {
      // Parse YAML to JSON
      const parsed = yamlLoad(content) as any;
      
      if (!parsed) {
        this.schemaValidationErrors = ['Invalid YAML: Could not parse content'];
        return;
      }

      // Compile and validate against JSON Schema
      const validate = this.ajv.compile(this.yamlSchema);
      const valid = validate(parsed);

      if (!valid && validate.errors) {
        this.schemaValidationErrors = validate.errors.map((error: any) => {
          const path = error.instancePath || error.schemaPath;
          return `${path}: ${error.message}`;
        });
      } else {
        this.schemaValidationErrors = [];
      }
    } catch (err: any) {
      // If YAML parsing fails, try regex-based fallback
      if (err.name === 'YAMLException') {
        this.schemaValidationErrors = [`YAML Parse Error: ${err.message}`];
      } else {
        // Fallback to regex-based validation
        this.validateSchemaFallback(content);
      }
    }
  }

  private validateSchemaFallback(content: string): void {
    // Fallback validation using regex for when YAML parsing fails
    const errors: string[] = [];
    
    // Check for required fields
    const toolIdMatch = content.match(/^toolId\s*:\s*(.+)$/m);
    if (!toolIdMatch || !toolIdMatch[1] || toolIdMatch[1].trim() === '""' || toolIdMatch[1].trim() === "''" || toolIdMatch[1].trim() === '') {
      errors.push('Missing or empty required field: toolId');
    }
    
    const nameMatch = content.match(/^name\s*:\s*(.+)$/m);
    if (!nameMatch || !nameMatch[1] || nameMatch[1].trim() === '""' || nameMatch[1].trim() === "''" || nameMatch[1].trim() === '') {
      errors.push('Missing or empty required field: name');
    }
    
    // Validate enums
    const securityClassMatch = content.match(/^securityClass\s*:\s*(\S+)$/m);
    if (securityClassMatch) {
      const securityClass = securityClassMatch[1].replace(/['"]/g, '');
      const validSecurityClasses = ['public', 'internal', 'restricted', 'highly-restricted'];
      if (!validSecurityClasses.includes(securityClass)) {
        errors.push(`Invalid securityClass: ${securityClass}. Must be one of: ${validSecurityClasses.join(', ')}`);
      }
    }
    
    const lifecycleStateMatch = content.match(/^lifecycleState\s*:\s*(\S+)$/m);
    if (lifecycleStateMatch) {
      const lifecycleState = lifecycleStateMatch[1].replace(/['"]/g, '');
      const validLifecycleStates = ['development', 'staging', 'pilot', 'production', 'deprecated', 'retired'];
      if (!validLifecycleStates.includes(lifecycleState)) {
        errors.push(`Invalid lifecycleState: ${lifecycleState}. Must be one of: ${validLifecycleStates.join(', ')}`);
      }
    }

    const retryPolicyMatch = content.match(/retryPolicy\s*:\s*(\S+)/);
    if (retryPolicyMatch) {
      const retryPolicy = retryPolicyMatch[1].replace(/['"]/g, '');
      const validRetryPolicies = ['exponential', 'linear', 'fixed'];
      if (!validRetryPolicies.includes(retryPolicy)) {
        errors.push(`Invalid retryPolicy: ${retryPolicy}. Must be one of: ${validRetryPolicies.join(', ')}`);
      }
    }

    this.schemaValidationErrors = errors;
  }

  formatYaml(): void {
    if (this.editor) {
      this.editor.getAction('editor.action.formatDocument').run();
    }
  }

  getYamlContent(): string {
    return this.editor ? this.editor.getValue() : this.yamlContent;
  }

  openTemplateGenerator(): void {
    const dialogRef = this.dialog.open(YamlTemplateGeneratorComponent, {
      width: '800px',
      data: {
        onGenerate: (yaml: string) => {
          this.yamlContent = yaml;
          if (this.editor) {
            this.editor.setValue(yaml);
          }
        }
      } as TemplateGeneratorData
    });
  }

  importYaml(): void {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      this.yamlContent = content;
      if (this.editor) {
        this.editor.setValue(content);
      }
    };
    reader.readAsText(file);
    
    // Reset input
    input.value = '';
  }

  exportYaml(): void {
    const content = this.getYamlContent();
    const blob = new Blob([content], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'tool-definition.yaml';
    link.click();
    URL.revokeObjectURL(url);
  }

  openDiffViewer(): void {
    const currentContent = this.getYamlContent();
    const dialogRef = this.dialog.open(YamlDiffViewerComponent, {
      width: '90%',
      maxWidth: '1400px',
      height: '90%',
      data: {
        originalContent: '',
        modifiedContent: currentContent
      }
    });

    dialogRef.afterOpened().subscribe(() => {
      const component = dialogRef.componentInstance;
      if (component) {
        component.setModifiedContent(currentContent);
      }
    });
  }

  undo(): void {
    if (this.editor) {
      this.editor.getAction('undo').run();
    }
  }

  redo(): void {
    if (this.editor) {
      this.editor.getAction('redo').run();
    }
  }

  canUndo(): boolean {
    if (!this.editor) {
      return false;
    }
    return this.editor.getAction('undo').isSupported();
  }

  canRedo(): boolean {
    if (!this.editor) {
      return false;
    }
    return this.editor.getAction('redo').isSupported();
  }

  copyToClipboard(): void {
    const content = this.getYamlContent();
    navigator.clipboard.writeText(content).then(() => {
      this.toastService.show('Copied to clipboard', 'success');
    }).catch(err => {
      console.error('Failed to copy to clipboard:', err);
      this.toastService.show('Failed to copy to clipboard', 'error');
    });
  }

  exportToJson(): void {
    const content = this.getYamlContent();
    try {
      const parsed = yamlLoad(content);
      const json = JSON.stringify(parsed, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'tool-definition.json';
      link.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Failed to export to JSON:', err);
      this.validationErrors = [`Failed to export: ${err.message}`];
    }
  }

  saveToLocalStorage(): void {
    const content = this.getYamlContent();
    const timestamp = new Date().toISOString();
    const name = prompt('Enter a name for this YAML file:', `yaml-${timestamp.split('T')[0]}`);
    
    if (!name) {
      return;
    }

    const savedFiles = this.getSavedFiles();
    const fileData = {
      name,
      content,
      timestamp,
      id: Date.now().toString()
    };

    savedFiles.push(fileData);
    localStorage.setItem('yaml-editor-saved-files', JSON.stringify(savedFiles));
    this.toastService.show(`Saved "${name}" to browser storage`, 'success');
  }

  loadFromLocalStorage(): void {
    const savedFiles = this.getSavedFiles();
    
    if (savedFiles.length === 0) {
      alert('No saved files found');
      return;
    }

    const dialogRef = this.dialog.open(YamlFileSelectorComponent, {
      width: '500px',
      data: {
        files: savedFiles,
        onSelect: (file: SavedFile) => {
          this.yamlContent = file.content;
          if (this.editor) {
            this.editor.setValue(file.content);
          }
          this.toastService.show(`Loaded "${file.name}"`, 'success');
        }
      } as FileSelectorData
    });
  }

  private getSavedFiles(): any[] {
    try {
      const stored = localStorage.getItem('yaml-editor-saved-files');
      return stored ? JSON.parse(stored) : [];
    } catch (err) {
      console.error('Failed to load saved files:', err);
      return [];
    }
  }

  ngOnDestroy(): void {
    if (this.validateDebounceTimer) {
      clearTimeout(this.validateDebounceTimer);
    }
    this.disposables.forEach(d => d.dispose());
    if (this.editor) {
      this.editor.dispose();
    }
  }
}

