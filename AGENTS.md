# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server (Vite, localhost:5173)
npm run build     # Production build
npm run lint      # ESLint check
npm run preview   # Preview production build locally
```

There are no automated tests in this project.

## Environment

Create a `.env` file at the root with:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

The Social Distribution module uses a **second hardcoded Supabase client** in `src/apps/social/services/socialService.js` — it connects to a separate Supabase project and has its own Make.com webhook URLs baked in. No env vars needed for that module.

## Architecture

Fractal AI is a React 19 + Vite SPA. It uses `HashRouter` (not `BrowserRouter`) so deployed builds work without server-side routing config.

### Directory layout

```
src/
  App.jsx                     # Root router, ProtectedLayout
  main.jsx                    # React root mount
  core/
    database/supabase.js      # Primary Supabase client (uses env vars)
    workspace/WorkspaceContext.jsx  # Multi-workspace provider (loads from DB, persists selection)
  apps/                       # Feature modules (each owns pages + components + services)
    agents/
      pages/                  # AgentRunner, Agents, MultiAgentWorkspace
      services/               # agentMemoryService, chatThreadService, conversationService
    analytics/
      pages/Analytics.jsx
      services/analyticsService.js
    content/
      pages/ContentAssets.jsx  # Placeholder for future content module
    dashboard/
      pages/Dashboard.jsx     # Mission Control
    integrations/
      pages/Integrations.jsx
    knowledge/
      pages/Knowledge.jsx
    projects/
      pages/Projects.jsx
      services/projectService.js
    settings/
      pages/Settings.jsx      # Platform settings + workspace management (tabbed)
    social/                   # Social Distribution Center (largest module)
      components/             # ~16 UI components
      pages/SocialDistribution.jsx
      services/socialService.js  # Own Supabase client + Make webhooks
    workflows/
      pages/Workflows.jsx
      services/               # workflowService, workflowRunService, workflowStepService, workflowEngineService
    workspace/
      components/             # WorkspaceHeader, Overview, Agents, Projects, Tasks, Activity, Badge, Files
      pages/Workspace.jsx
  pages/
    Auth.jsx                  # Login/register (public route)
    Applications.jsx          # App launcher grid
  shared/
    components/
      Sidebar.jsx             # Nav sidebar with workspace switcher dropdown
      Topbar.jsx              # Shows active workspace name
      CommandCenter.jsx       # Cmd+K spotlight search
  services/                   # Cross-cutting services (used by multiple modules)
    authService.js            # Custom username/password auth via Supabase RPC
    activityService.js        # Activity logging (used by projects, workflows, openai)
    agentService.js           # Agent CRUD (used by agents, knowledge, workflows)
    knowledgeService.js       # Knowledge CRUD (used by knowledge page + openaiService)
    openaiService.js          # runAgent() — calls Supabase Edge Function "run-agent"
    workspaceService.js       # Workspace CRUD + client queries
  data/mockData.js
```

### Service organization

Services follow a split pattern:
- **Module-specific services** live in `src/apps/<module>/services/` (e.g., `chatThreadService` in agents)
- **Cross-cutting services** stay in `src/services/` (auth, activity, agents, knowledge, openai, workspace)
- Cross-cutting services are those used by 2+ modules or by the core platform

### Auth pattern

Auth is **custom username/password**, not Supabase Auth. `loginUser` / `registerUser` call Supabase RPC functions (`login_app_user`, `register_app_user`). The session is stored in `localStorage` as `fractal_user`. `getSession()` is called synchronously inside `ProtectedLayout` to gate access.

### AI execution

Agent runs go through `src/services/openaiService.js` → `runAgent()`, which invokes the **Supabase Edge Function** named `run-agent` (not a direct OpenAI API call from the browser). The edge function receives the agent object, prompt, knowledge context, and conversation history.

`src/apps/workflows/services/workflowEngineService.js` → `executeWorkflow()` chains multiple `runAgent()` calls sequentially, passing each step's output as context to the next step.

### Two Supabase clients

- **Primary** (`src/core/database/supabase.js`): env-var driven, used by all `src/services/` and most `src/apps/`.
- **Social** (`src/apps/social/services/socialService.js`): hardcoded credentials, dedicated to the Social Distribution module's `generated_posts` and `content_assets` tables plus Make.com webhook calls.

### Workspace system

`WorkspaceContext` (`src/core/workspace/WorkspaceContext.jsx`) provides multi-workspace support:
- Loads workspaces from the `workspaces` Supabase table on app init
- Persists selected workspace ID in `localStorage` (`fractal_workspace_id`)
- Exposes `workspace`, `workspaces`, `switchWorkspace()`, and `refreshWorkspaces()` via `useWorkspace()` hook
- Falls back to a default workspace if DB is empty or unreachable
- Workspace switcher UI is in the Sidebar; full CRUD is in Settings → Workspaces tab

### Social Distribution data flow

1. User creates a content asset → inserted into `content_assets` → POST to Make generate webhook → Make triggers AI post generation.
2. Generated posts appear in `generated_posts` table (polled every 30 seconds).
3. User reviews/edits a post → saves to DB → schedules via `scheduleAndSendPost()` → POST to Make schedule webhook → Make publishes to social platforms.
