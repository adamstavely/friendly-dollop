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
    // Configure these values for production deployment
    publicKey: '', // Set your LangFuse public key here
    secretKey: '', // Set your LangFuse secret key here
    host: 'https://cloud.langfuse.com',
    projectId: '', // Set your LangFuse project ID here
    trackWorkflows: true,
    trackToolCalls: true,
    trackQualityScores: true,
    trackAgentInteractions: true
  }
};

