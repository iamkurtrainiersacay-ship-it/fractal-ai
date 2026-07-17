-- Workspace isolation for agents + agent memory.
-- Run this manually in the Supabase SQL editor before deploying the app
-- changes that filter agents/agent_memory by workspace_id.

alter table agents add column if not exists workspace_id uuid references workspaces(id);
alter table agent_memory add column if not exists workspace_id uuid references workspaces(id);

-- Backfill existing rows into the first/default workspace so nothing
-- currently installed disappears once the filter goes live.
update agents
set workspace_id = (select id from workspaces order by created_at asc limit 1)
where workspace_id is null;

update agent_memory
set workspace_id = (
  select a.workspace_id from agents a where a.id = agent_memory.agent_id
)
where workspace_id is null;

create index if not exists idx_agents_workspace_id on agents(workspace_id);
create index if not exists idx_agent_memory_workspace_id on agent_memory(workspace_id);
