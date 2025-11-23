export const environment = {
  production: true,
  apiUrl: 'https://api.example.com/api',
  authUrl: 'https://api.example.com/api/auth',
  inspectorUrl: 'http://localhost:6274', // MCP Inspector URL - update for production deployment
  flowiseUrl: 'https://flowise.example.com', // Flowise API URL - update for production deployment
  langchainBackendUrl: 'https://langchain-backend.example.com/api', // Langchain/Langgraph backend API URL
  // LangFuse Configuration
  langfuse: {
    enabled: true,
    publicKey: process.env['NG_APP_LANGFUSE_PUBLIC_KEY'] || '',
    secretKey: process.env['NG_APP_LANGFUSE_SECRET_KEY'] || '',
    host: process.env['NG_APP_LANGFUSE_HOST'] || 'https://cloud.langfuse.com',
    projectId: process.env['NG_APP_LANGFUSE_PROJECT_ID'] || '',
    trackWorkflows: true,
    trackToolCalls: true,
    trackQualityScores: true,
    trackAgentInteractions: true
  }
};

