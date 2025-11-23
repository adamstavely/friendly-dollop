export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  authUrl: 'http://localhost:3000/api/auth',
  useMockData: true, // Set to false when backend is available
  inspectorUrl: 'http://localhost:6274', // MCP Inspector URL
  flowiseUrl: 'http://localhost:3000', // Flowise API URL
  langchainBackendUrl: 'http://localhost:8000/api', // Langchain/Langgraph backend API URL
  // LangFuse Configuration
  langfuse: {
    enabled: true, // Feature flag
    publicKey: process.env['NG_APP_LANGFUSE_PUBLIC_KEY'] || '',
    secretKey: process.env['NG_APP_LANGFUSE_SECRET_KEY'] || '',
    host: process.env['NG_APP_LANGFUSE_HOST'] || 'https://cloud.langfuse.com',
    projectId: process.env['NG_APP_LANGFUSE_PROJECT_ID'] || '',
    // Feature flags
    trackWorkflows: true,
    trackToolCalls: true,
    trackQualityScores: true,
    trackAgentInteractions: true
  }
};

