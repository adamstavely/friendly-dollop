# Information Architecture & Homepage/Dashboard Plan

## Current Issues

1. **Flat Navigation**: 11 items in sidebar with no grouping or hierarchy
2. **No Homepage**: App redirects directly to /tools, no overview
3. **No Context**: Users don't see system health, key metrics, or quick actions
4. **Poor Discoverability**: All features at same level, hard to find related items
5. **No User Guidance**: No indication of what's important or what needs attention

## Proposed Information Architecture

### Navigation Structure (Grouped by Purpose)

#### Primary Navigation (Top Level)
1. **Dashboard** (Home) - Overview and key metrics
2. **Tools** - Core tool management
3. **Governance** - Lifecycle, Quality, Compliance
4. **Operations** - Dependencies, Bundles, Policies
5. **Development** - GitOps, Schema
6. **Administration** - Personas, Retirement

### Detailed Navigation Structure

```
Dashboard (Home)
├── Overview Metrics
├── Recent Activity
├── Quick Actions
└── System Health

Tools
├── All Tools (list)
├── Create Tool
└── Tool Detail (from list)

Governance
├── Lifecycle Management
│   ├── Dashboard
│   └── Promotion Workflows
├── Quality & Metrics
│   ├── Quality Dashboard
│   └── Quality Trends
└── Compliance
    ├── Compliance Overview
    └── Compliance Scanner

Operations
├── Dependencies
│   └── Dependency Graph
├── Bundles
│   ├── All Bundles
│   └── Create Bundle
└── Policies & Rate Limits
    └── Policy Viewer

Development
├── GitOps
│   └── GitOps Sync
└── Schema
    └── Schema Viewer

Administration
├── Agent Personas
│   └── Persona Matrix
└── Retirement
    └── Retirement Console
```

## Implementation Plan

### Phase 1: Create Homepage/Dashboard Component

#### 1.1 Dashboard Component Structure
- **File**: `mcp-registry/src/app/features/dashboard/components/dashboard/dashboard.component.ts`
- **Sections**:
  1. **Key Metrics Cards** (4-6 cards)
     - Total Tools
     - Tools in Production
     - Average Quality Score
     - Active Bundles
     - Tools Needing Attention
     - System Health Status
  2. **Quick Actions** (button grid)
     - Create New Tool
     - Create Bundle
     - View Dependencies
     - Promote Tools
     - Scan Compliance
  3. **Recent Activity Feed**
     - Recent tool registrations
     - Recent promotions
     - Recent quality updates
     - Recent compliance scans
  4. **Alerts & Notifications**
     - Tools needing promotion
     - Orphan tools
     - Quality score drops
     - Compliance violations
  5. **Charts/Visualizations**
     - Tools by lifecycle state (pie/bar chart)
     - Quality score distribution
     - Tools by domain
     - Recent activity timeline

#### 1.2 Dashboard Service
- **File**: `mcp-registry/src/app/features/dashboard/services/dashboard.service.ts`
- **Methods**:
  - `getDashboardData()` - Aggregated metrics
  - `getRecentActivity()` - Activity feed
  - `getAlerts()` - Alerts and notifications
  - `getQuickStats()` - Key statistics

### Phase 2: Reorganize Navigation

#### 2.1 Update Main Layout with Grouped Navigation
- **File**: `mcp-registry/src/app/layout/main-layout/main-layout.component.ts`
- **Changes**:
  - Add expandable sections (mat-expansion-panel or mat-accordion)
  - Group related features
  - Add "Dashboard" as first item
  - Use icons and visual hierarchy
  - Add search functionality (optional)

#### 2.2 Navigation Structure
```typescript
Navigation:
- Dashboard (home icon)
- Tools (expandable)
  - All Tools
  - Create Tool
- Governance (expandable)
  - Lifecycle
  - Quality
  - Compliance
- Operations (expandable)
  - Dependencies
  - Bundles
  - Policies
- Development (expandable)
  - GitOps
  - Schema
- Administration (expandable)
  - Personas
  - Retirement
```

### Phase 3: Update Routes

#### 3.1 Add Dashboard Route
- **File**: `mcp-registry/src/app/app.routes.ts`
- **Change**: Update root redirect to `/dashboard` instead of `/tools`
- **Add**: Dashboard route as first route

#### 3.2 Create Dashboard Routes File
- **File**: `mcp-registry/src/app/features/dashboard/dashboard.routes.ts`
- **Routes**: Single route for dashboard component

### Phase 4: Enhance Dashboard with Widgets

#### 4.1 Create Dashboard Widgets
- **MetricsCardComponent** - Reusable metric card
- **QuickActionComponent** - Quick action button
- **ActivityFeedComponent** - Recent activity list
- **AlertsPanelComponent** - Alerts and notifications
- **ChartWidgetComponent** - Chart container

#### 4.2 Dashboard Layout
- Use Angular Material Grid or CSS Grid
- Responsive layout (mobile-friendly)
- Drag-and-drop widget arrangement (future enhancement)

## Detailed Component Specifications

### Dashboard Component

**Location**: `mcp-registry/src/app/features/dashboard/components/dashboard/dashboard.component.ts`

**Features**:
- Grid layout with cards/widgets
- Key metrics at top (4-6 cards in row)
- Quick actions section
- Recent activity feed
- Alerts panel
- Charts section (tools by state, quality distribution)

**Data Sources**:
- ToolService - for tool counts and stats
- LifecycleService - for lifecycle metrics
- QualityService - for quality scores
- BundleService - for bundle stats
- ComplianceService - for compliance alerts
- RetirementService - for orphan tools

### Navigation Component Updates

**Location**: `mcp-registry/src/app/layout/main-layout/main-layout.component.ts`

**Changes**:
- Replace flat list with grouped navigation
- Use mat-expansion-panel for collapsible groups
- Add visual hierarchy (icons, spacing, colors)
- Highlight active section
- Add search/filter (optional)

## User Experience Improvements

### Benefits of New Architecture

1. **Better Discoverability**: Grouped features are easier to find
2. **Context at a Glance**: Dashboard shows what's important
3. **Faster Navigation**: Quick actions reduce clicks
4. **Clear Hierarchy**: Primary vs secondary features
5. **Reduced Cognitive Load**: Fewer items visible at once

### Dashboard Value

1. **System Overview**: See health and status immediately
2. **Quick Actions**: Common tasks accessible from home
3. **Alerts**: Important issues highlighted
4. **Activity**: Recent changes visible
5. **Metrics**: Key numbers at a glance

## Implementation Steps

### Step 1: Create Dashboard Feature Module
1. Create dashboard feature folder structure
2. Create dashboard component
3. Create dashboard service
4. Create dashboard routes
5. Add route to app.routes.ts

### Step 2: Build Dashboard UI
1. Create metrics cards
2. Create quick actions section
3. Create activity feed component
4. Create alerts panel
5. Add charts (using existing Chart.js integration)

### Step 3: Update Navigation
1. Refactor MainLayoutComponent
2. Add grouped navigation with expansion panels
3. Update styling for hierarchy
4. Test navigation flow

### Step 4: Update Routes
1. Change root redirect to /dashboard
2. Ensure all routes still work
3. Test navigation from dashboard

### Step 5: Add Dashboard Data
1. Implement dashboard service methods
2. Aggregate data from multiple services
3. Add caching for performance
4. Handle loading/error states

## File Structure

```
src/app/
├── features/
│   └── dashboard/
│       ├── components/
│       │   ├── dashboard/
│       │   │   └── dashboard.component.ts
│       │   ├── metrics-card/
│       │   │   └── metrics-card.component.ts
│       │   ├── quick-actions/
│       │   │   └── quick-actions.component.ts
│       │   ├── activity-feed/
│       │   │   └── activity-feed.component.ts
│       │   └── alerts-panel/
│       │       └── alerts-panel.component.ts
│       ├── services/
│       │   └── dashboard.service.ts
│       └── dashboard.routes.ts
└── layout/
    └── main-layout/
        └── main-layout.component.ts (updated)
```

## Design Considerations

### Dashboard Layout
- **Top Row**: Key metrics (4-6 cards)
- **Second Row**: Quick actions (grid of buttons)
- **Left Column**: Recent activity feed
- **Right Column**: Alerts and notifications
- **Bottom**: Charts and visualizations

### Navigation Design
- **Collapsible Groups**: Use mat-expansion-panel
- **Icons**: Keep existing icons, add group icons
- **Active State**: Highlight active item and parent group
- **Spacing**: Better visual separation between groups
- **Search**: Optional search bar at top of sidebar

### Responsive Design
- **Mobile**: Collapsible sidebar, stacked dashboard widgets
- **Tablet**: Sidebar can collapse, dashboard adapts
- **Desktop**: Full sidebar, multi-column dashboard

## Success Metrics

### Usability Improvements
- Reduced clicks to common tasks
- Faster discovery of features
- Better understanding of system state
- Clearer navigation hierarchy

### Dashboard Value
- Users see key metrics immediately
- Quick actions reduce navigation time
- Alerts surface important issues
- Activity feed provides context

## Next Steps After Implementation

1. **User Testing**: Get feedback on navigation structure
2. **Analytics**: Track which dashboard widgets are most used
3. **Customization**: Allow users to customize dashboard (future)
4. **Widgets**: Add more dashboard widgets as needed
5. **Search**: Add global search functionality

