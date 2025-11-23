export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000/api', // FastAPI backend (LangFuse proxy)
  authUrl: 'http://localhost:3000/api/auth',
  useMockData: false, // Set to false to use backend API
  inspectorUrl: 'http://localhost:6274', // MCP Inspector URL
  flowiseUrl: 'http://localhost:3000', // Flowise API URL
  langchainBackendUrl: 'http://localhost:8000/api', // Langchain/Langgraph backend API URL
  // LangFuse Configuration
  langfuse: {
    enabled: true, // Feature flag
    // Configure these values directly or use Angular's environment variable replacement
    // For production, update environment.prod.ts with actual values
    publicKey: '', // Set your LangFuse public key here
    secretKey: '', // Set your LangFuse secret key here
    host: 'https://cloud.langfuse.com',
    projectId: '', // Set your LangFuse project ID here
    // Feature flags
    trackWorkflows: true,
    trackToolCalls: true,
    trackQualityScores: true,
    trackAgentInteractions: true
  }
};

