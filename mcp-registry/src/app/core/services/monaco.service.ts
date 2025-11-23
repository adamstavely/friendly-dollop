import { Injectable } from '@angular/core';

declare var monaco: any;

@Injectable({
  providedIn: 'root'
})
export class MonacoService {
  private yamlInitialized: boolean = false;
  private initializationPromise: Promise<void> | null = null;

  constructor() {
    this.initializeMonacoYaml();
  }

  /**
   * Initialize Monaco YAML language support
   */
  async initializeMonacoYaml(): Promise<void> {
    if (this.yamlInitialized || this.initializationPromise) {
      return this.initializationPromise || Promise.resolve();
    }

    this.initializationPromise = this.loadMonacoYaml();
    await this.initializationPromise;
    this.yamlInitialized = true;
  }

  private async loadMonacoYaml(): Promise<void> {
    if (typeof monaco === 'undefined') {
      console.warn('Monaco Editor not loaded');
      return;
    }

    try {
      // Try to dynamically import monaco-yaml
      // Use type assertion to avoid TypeScript errors with dynamic imports
      const monacoYamlModule = await import('monaco-yaml') as any;
      
      // monaco-yaml v4+ API - try different possible patterns
      if (monacoYamlModule) {
        // Try setupMonacoYaml function (v3 API)
        if (typeof monacoYamlModule.setupMonacoYaml === 'function') {
          monacoYamlModule.setupMonacoYaml(monaco, {
            enableSchemaRequest: true,
            schemas: []
          });
          console.log('Monaco YAML initialized successfully (v3 API)');
          return;
        }
        
        // Try default export as function (v4+ API)
        if (typeof monacoYamlModule.default === 'function') {
          monacoYamlModule.default(monaco, {
            enableSchemaRequest: true,
            schemas: []
          });
          console.log('Monaco YAML initialized successfully (v4+ API)');
          return;
        }
        
        // Try if the module itself is a function
        if (typeof monacoYamlModule === 'function') {
          monacoYamlModule(monaco, {
            enableSchemaRequest: true,
            schemas: []
          });
          console.log('Monaco YAML initialized successfully (direct function)');
          return;
        }
      }
      
      // If we get here, monaco-yaml is available but API is different
      console.warn('Monaco YAML package found but API structure is different, using fallback');
      this.registerBasicYamlSupport();
    } catch (error) {
      // monaco-yaml not available or failed to load
      console.warn('Monaco YAML package not available, using fallback:', error);
      // Fallback: register basic YAML language if needed
      this.registerBasicYamlSupport();
    }
  }

  private registerBasicYamlSupport(): void {
    if (typeof monaco === 'undefined' || !monaco.languages) {
      return;
    }

    // Check if YAML is already registered
    if (monaco.languages.getLanguages().some((lang: any) => lang.id === 'yaml')) {
      return;
    }

    // Register basic YAML language support
    try {
      monaco.languages.register({ id: 'yaml' });
      monaco.languages.setMonarchTokensProvider('yaml', {
        tokenizer: {
          root: [
            [/^\s*---/, 'comment'],
            [/^\s*#.*$/, 'comment'],
            [/^\s*-/, 'keyword'],
            [/:\s*$/, 'delimiter'],
            [/:\s+/, 'delimiter'],
            [/"([^"\\]|\\.)*$/, 'string.invalid'],
            [/'([^'\\]|\\.)*$/, 'string.invalid'],
            [/"/, 'string', '@string_double'],
            [/'/, 'string', '@string_single'],
            [/\d+/, 'number'],
            [/true|false/, 'keyword'],
            [/null/, 'keyword']
          ],
          string_double: [
            [/[^\\"]+/, 'string'],
            [/\\./, 'string.escape'],
            [/"/, 'string', '@pop']
          ],
          string_single: [
            [/[^\\']+/, 'string'],
            [/\\./, 'string.escape'],
            [/'/, 'string', '@pop']
          ]
        }
      });
    } catch (error) {
      console.warn('Failed to register basic YAML support:', error);
    }
  }

  /**
   * Register a schema for YAML validation
   */
  registerYamlSchema(uri: string, schema: any, fileMatch: string[] = ['*']): void {
    if (typeof monaco === 'undefined') {
      return;
    }

    try {
      if (monaco.languages && monaco.languages.yaml && monaco.languages.yaml.yamlDefaults) {
        const schemas = monaco.languages.yaml.yamlDefaults.schemas || [];
        schemas.push({
          uri,
          fileMatch,
          schema
        });
        monaco.languages.yaml.yamlDefaults.setDiagnosticsOptions({
          validate: true,
          enableSchemaRequest: true,
          schemas
        });
      }
    } catch (error) {
      console.warn('Failed to register YAML schema:', error);
    }
  }

  /**
   * Check if Monaco YAML is initialized
   */
  isYamlInitialized(): boolean {
    return this.yamlInitialized;
  }

  /**
   * Wait for Monaco YAML to be initialized
   */
  async waitForInitialization(): Promise<void> {
    if (this.initializationPromise) {
      await this.initializationPromise;
    }
  }
}

