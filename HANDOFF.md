# Fractal AI — Handoff Document

**Date:** June 29, 2026  
**Project:** Fractal AI Platform  
**Live URL:** https://fractal-ai-blond.vercel.app/  
**WordPress:** https://soveraign.solutions/fractal-2/  
**Repo:** https://github.com/iamkurtrainiersacay-ship-it/fractal-ai  
**Vercel:** https://vercel.com/iamkurtrainiersacay-ship-its-projects/fractal-ai

---

## What Was Done This Session

### 1. Full CSS Redesign (Glassmorphism)
- Rewrote all 3500+ lines of `App.css` from flat design to premium glassmorphism
- `backdrop-filter: blur()` on cards, panels, sidebar, dropdowns
- Neon glow accents on hover/active states with `box-shadow`
- Gradient headings (white-to-purple), gradient buttons
- Radial ambient light on background surfaces
- Spring easing (`cubic-bezier(0.16, 1, 0.3, 1)`) for animations
- `prefers-reduced-motion` support for accessibility
- Styled toast notifications matching the dark theme

### 2. Security Pass
- **Moved hardcoded Supabase credentials** from `socialService.js` to env vars (`VITE_SOCIAL_SUPABASE_URL`, `VITE_SOCIAL_SUPABASE_ANON_KEY`)
- **Moved Make.com webhook URLs** to env vars (`VITE_MAKE_GENERATE_WEBHOOK`, `VITE_MAKE_SCHEDULE_WEBHOOK`)
- **Removed prefilled demo credentials** (`admin/admin123`) from Auth.jsx
- **Added JWT-like session** with 24h TTL, auto-expiry on `getSession()`, `refreshSession()` function
- **Fixed hardcoded `approved_by: "Kurt"`** in socialService — now reads from current session
- **Created `.env.example`** documenting all required env vars
- `.env` already in `.gitignore`

### 3. Bug Fixes
- **Removed duplicate `/agents` route** (was defined twice in App.jsx)
- **Fixed 406 error** on `app_users` query — changed `.single()` to `.limit(1)` 
- **Graceful error handling** for missing `integrations` table and session tracking columns

### 4. Workspace Page — Wired to Real Data
- `WorkspaceAgents.jsx` — fetches from `agents` table
- `WorkspaceProjects.jsx` — fetches from `projects` table
- `WorkspaceTasks.jsx` — fetches recent runs from `activity_logs`
- `WorkspaceActivity.jsx` — fetches activity logs with relative timestamps

### 5. Agent Memory Injection
- `openaiService.js` now fetches agent memory via `getAgentMemory()` in parallel with knowledge + history
- Calls `buildMemoryContext()` and passes `memory` field to the edge function
- Switched to `getKnowledgeForAgent()` for agent-scoped knowledge
- Added `total_tokens` and `estimated_cost` to activity log metadata

### 6. Integrations Page (Full Build)
- 8 integration cards: OpenAI, Supabase, Gmail, WordPress, Make.com, Zoho, Discord, Claude
- API key fields with show/hide toggle for secrets
- Save to Supabase `integrations` table (service_key, config JSON, connected boolean)
- Edit, disconnect flow with toast notifications

### 7. Analytics — Recharts Time-Series
- 4 charts: Runs over time (line), Tokens over time (bar), Cost over time (line), Runs by Agent (horizontal bar)
- `analyticsService.js` groups data by day and by agent
- Custom dark-themed tooltip component
- 5-card summary row (runs, tokens, errors, cost, active agents)

### 8. Error Boundaries
- Created `ErrorBoundary.jsx` React class component with retry button
- Wrapped all routes in `<ErrorBoundary>` in App.jsx
- Toaster styled with dark glassmorphism theme

### 9. Content Assets Page (Full Build)
- Create form: title, URL, category, content type, priority, CTA, description, image upload
- Creates via `createContentAsset()` which triggers Make.com webhook
- Asset library grid with search, status badges, image previews
- Route: `/content-assets`

### 10. Pagination
- **Social Distribution:** `SocialPostList` paginates at 25 posts/page with Prev/Next
- **Knowledge:** Search bar, type filter dropdown, 12 items/page pagination

### 11. TypeScript Migration (Started)
- Installed `typescript`, `@types/react`, `@types/react-dom`
- `tsconfig.json` with `allowJs: true` for incremental migration
- `vite-env.d.ts` with typed env vars (`ImportMetaEnv`)
- Converted `supabase.js` → `supabase.ts` and `authService.js` → `authService.ts`
- `npx tsc --noEmit` passes with zero errors

### 12. Interactive Onboarding Tour
- 14-step spotlight walkthrough on first login
- Highlights real UI elements with pulsing purple border
- Users click sidebar links, open workspace switcher, press Ctrl+K
- Tour advances when the action is performed
- Stored in `localStorage` (`fractal_onboarding_complete`)

### 13. Ask Fractal — In-App Help
- Chat panel in sidebar with 15-topic knowledge base
- Real-time autocomplete as users type
- Quick-start prompts for new users
- Covers: workflows, agents, social distribution, knowledge, analytics, integrations, workspaces, settings, shortcuts

### 14. Super Admin Panel
- **Route:** `/admin` (only visible to super admins)
- **Users tab:** all users with online/offline status, last seen, join date, avatar
- **Promote/Revoke** admin privileges, **Delete** accounts
- Gold-styled sidebar link with shield icon
- **Session History tab:** login/logout events with duration

### 15. Logout Button & Session Tracking
- **Topbar:** logout button (red hover), username pill, live session duration counter
- **Session tracking:** logs `session_start`/`session_end` to `activity_logs` with duration
- Heartbeat updates `is_online` every 60s
- Marks offline on tab close

### 16. Vercel + WordPress Deployment
- `vercel.json` with CSP headers allowing iframe on `soveraign.solutions`
- WordPress page at `soveraign.solutions/fractal-2/` with full-screen iframe embed

---

## Environment Variables (Vercel)

All must be set in Vercel → Settings → Environment Variables:

```
VITE_SUPABASE_URL=https://pbqvdnirgbwnexbifqse.supabase.co
VITE_SUPABASE_ANON_KEY=<your key>
VITE_SOCIAL_SUPABASE_URL=https://tgrjnydebfkfqgaqbtdz.supabase.co
VITE_SOCIAL_SUPABASE_ANON_KEY=<your key>
VITE_MAKE_GENERATE_WEBHOOK=<your webhook url>
VITE_MAKE_SCHEDULE_WEBHOOK=<your webhook url>
```

---

## Supabase Tables Required

### Primary Supabase Project
| Table | Purpose |
|-------|---------|
| `app_users` | User accounts (username, password_hash, role, is_super_admin, is_online, last_seen) |
| `workspaces` | Multi-workspace system |
| `agents` | AI agent configurations |
| `agent_memory` | Persistent agent memory items |
| `agent_chat_threads` | Chat thread metadata |
| `agent_chat_messages` | Chat messages per thread |
| `agent_conversations` | Conversation history for context |
| `knowledge` | Knowledge base items (SOPs, prompts, etc.) |
| `projects` | Project management |
| `workflows` | Workflow definitions |
| `workflow_steps` | Steps within workflows |
| `workflow_runs` | Workflow execution history |
| `activity_logs` | All platform activity (agent runs, sessions, etc.) |
| `clients` | Client records for workspace context |
| `integrations` | API key storage for external services |

### Social Supabase Project (separate)
| Table | Purpose |
|-------|---------|
| `generated_posts` | AI-generated social media posts |
| `content_assets` | Content assets that trigger AI generation |

### RLS Policies Needed
```sql
-- Allow app to read user admin status
CREATE POLICY "Allow read app_users" ON app_users FOR SELECT USING (true);
```

### Columns Added to `app_users`
```sql
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS is_super_admin boolean DEFAULT false;
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS is_online boolean DEFAULT false;
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS last_seen timestamptz;
```

---

## File Structure (Key Files Modified/Created)

```
src/
  App.jsx                          # Root router + onboarding + session tracking + admin route
  App.css                          # Full glassmorphism redesign (~4000 lines)
  
  core/database/supabase.ts        # Primary Supabase client (TypeScript)
  
  services/
    authService.ts                 # JWT-like session, admin flag fetch (TypeScript)
    adminService.js                # User CRUD, online status, session logging
    sessionService.js              # Session start/end tracking, duration
    openaiService.js               # Agent execution with memory injection
  
  shared/components/
    Sidebar.jsx                    # Nav + workspace switcher + admin link + Ask Fractal
    Topbar.jsx                     # Logout button, username, session timer
    ErrorBoundary.jsx              # React error boundary with retry
    Onboarding.jsx                 # Interactive spotlight tour (14 steps)
    AskFractal.jsx                 # In-app help assistant (15 topics)
    CommandCenter.jsx              # Ctrl+K spotlight search
  
  apps/
    admin/pages/Admin.jsx          # Super Admin panel
    analytics/pages/Analytics.jsx  # Recharts time-series (4 charts)
    analytics/services/            # Daily + per-agent aggregation
    content/pages/ContentAssets.jsx # Content asset CRUD + Make.com trigger
    integrations/pages/            # API key storage for 8 services
    knowledge/pages/Knowledge.jsx  # Search + type filter + pagination
    social/components/SocialPostList.jsx  # Paginated (25/page)
    social/services/socialService.js     # Env var credentials, session-aware user
    workspace/components/          # All 4 wired to real Supabase data
  
  .env.example                     # All required env vars documented
  vercel.json                      # CSP headers for iframe embed
  tsconfig.json                    # TypeScript config (allowJs for incremental migration)
  vite-env.d.ts                    # Typed env vars
```

---

## Known Issues / Next Steps

### To Fix
- **TypeScript migration is partial** — only `supabase.ts` and `authService.ts` converted; remaining `.jsx` files can be converted incrementally
- **No real-time WebSocket subscriptions** — Social Distribution polls every 30s instead
- **Dashboard data is mostly static** — health status and activity are hardcoded

### Recommended Next Features
1. **Streaming agent responses** — word-by-word like ChatGPT instead of waiting for full response
2. **Auto-learning agent memory** — extract key facts from conversations automatically
3. **Scheduled agent runs** — cron-style recurring agent execution
4. **Role-based access control** — beyond super admin (Editor, Viewer roles)
5. **Webhook status tracking** — see which Make.com posts succeeded/failed
6. **Mobile responsive pass** — end-to-end testing on small screens
7. **Notification bell** — persistent notifications for completed runs, scheduled posts

### To Make Yourself Super Admin
```sql
UPDATE app_users SET is_super_admin = true WHERE username = 'iamkurt';
```

### To Reset Onboarding Tour
```js
localStorage.removeItem('fractal_onboarding_complete')
```

### To Clear Session (Force Re-login)
```js
localStorage.removeItem('fractal_user')
```

---

## Tech Stack

- **Frontend:** React 19, Vite, TypeScript (partial), CSS (custom)
- **Backend:** Supabase (PostgreSQL, Edge Functions, Storage)
- **AI:** OpenAI via Supabase Edge Function `run-agent`
- **Automation:** Make.com webhooks for social distribution
- **Deployment:** Vercel (auto-deploy from GitHub main branch)
- **WordPress:** iframe embed at `soveraign.solutions/fractal-2/`
- **Icons:** Lucide React
- **Charts:** Recharts
- **Notifications:** react-hot-toast
