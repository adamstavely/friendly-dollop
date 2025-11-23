# MCP Registry - Angular Application

A comprehensive Angular application for managing Model Context Protocol (MCP) tools with lifecycle management, dependency tracking, quality scoring, and agent integration features.

## Features

- **Tool Management**: Full CRUD operations for MCP tools with versioning
- **Lifecycle Management**: State machine for tool promotion (development → staging → pilot → production → deprecated → retired)
- **Dependency Graph**: Interactive visualization of tool dependencies
- **Quality Scoring**: Telemetry-based quality metrics and ranking
- **Tool Bundles**: Group related tools into cohesive packages
- **Rate Limits & Policies**: Configure and view rate limits and execution policies
- **GitOps Integration**: YAML-based tool registration with validation
- **Retirement Workflows**: Orphan detection and automated sunsetting
- **Agent Personas**: Persona-based access control and capability negotiation
- **Compliance Management**: Compliance tags and regulatory classifications
- **Schema Visualization**: Auto-generated schema diagrams and viewers

## Tech Stack

- **Angular 17+** with standalone components
- **Angular Material** for UI components
- **RxJS** for reactive programming
- **TypeScript** for type safety

## Project Structure

```
src/
├── app/
│   ├── core/                    # Core services, guards, interceptors
│   ├── shared/                  # Shared components, pipes, models
│   ├── features/                # Feature modules
│   │   ├── tools/               # Tool management
│   │   ├── lifecycle/           # Lifecycle management
│   │   ├── dependencies/        # Dependency graph
│   │   ├── quality/             # Quality scoring
│   │   ├── bundles/             # Tool bundles
│   │   ├── policies/            # Rate limits & policies
│   │   ├── gitops/              # GitOps integration
│   │   ├── retirement/          # Retirement workflows
│   │   ├── personas/            # Agent persona management
│   │   ├── compliance/          # Compliance management
│   │   └── schema/              # Schema visualization
│   └── layout/                  # Layout components
└── environments/                # Environment configuration
```

## Development

### Prerequisites

- Node.js 18+ and npm
- Angular CLI 17+

### Installation

```bash
npm install
```

### Development Server

```bash
npm start
# or
ng serve
```

Navigate to `http://localhost:4200/`

### Build

```bash
npm run build
```

### Testing

```bash
npm test
```

## API Integration

The application expects a NestJS backend API running at `http://localhost:3000/api` by default. Update the environment files to configure the API URL:

- `src/environments/environment.ts` (development)
- `src/environments/environment.prod.ts` (production)

## Backend API Endpoints

The application integrates with the following API endpoints:

- `GET /tools` - List all tools
- `POST /tools` - Create new tool
- `GET /tools/{id}` - Get tool details
- `PUT /tools/{id}` - Update tool
- `DELETE /tools/{id}` - Delete tool
- `POST /tools/{id}/promote` - Promote tool lifecycle state
- `GET /tools/{id}/dependencies` - Get dependencies
- `GET /tools/{id}/reverse-dependencies` - Get reverse dependencies
- `GET /tools/{id}/quality-score` - Get quality score
- `POST /tools/{id}/feedback` - Submit agent feedback
- `GET /bundles` - List bundles
- `POST /gitops/sync` - Trigger GitOps sync
- `POST /mcp/negotiate/persona` - Agent persona negotiation
- And more...

## Authentication

The application uses OAuth/OIDC for authentication. Configure your identity provider in the environment files.

## License

Internal use only.
