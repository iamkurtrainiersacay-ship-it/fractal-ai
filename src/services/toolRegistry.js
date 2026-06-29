import { getAgents, createAgent } from "./agentService";
import { getKnowledge, createKnowledge } from "./knowledgeService";
import { getProjects, createProject } from "../apps/projects/services/projectService";
import { getWorkflows, createWorkflow } from "../apps/workflows/services/workflowService";
import { getAnalytics } from "../apps/analytics/services/analyticsService";
import { getActivityLogs } from "./activityService";
import { createContentAsset, getGeneratedPosts } from "../apps/social/services/socialService";
import { getWorkspaces, createWorkspace } from "./workspaceService";
import { runAgent } from "./openaiService";

export const TOOLS = [
  {
    name: "list_agents",
    description: "List all installed AI agents with their names, roles, and status",
    parameters: {},
    execute: async () => {
      const agents = await getAgents();
      return { agents: agents.map(a => ({ id: a.id, name: a.name, role: a.role, status: a.status })) };
    }
  },
  {
    name: "run_agent",
    description: "Run a specific AI agent with a prompt. Use this when the user wants an agent to generate content, analyze something, or perform a task.",
    parameters: { agent_name: "string", prompt: "string" },
    execute: async (params) => {
      const agents = await getAgents();
      const agent = agents.find(a =>
        a.name.toLowerCase().includes(params.agent_name.toLowerCase())
      );
      if (!agent) return { error: `Agent "${params.agent_name}" not found. Available: ${agents.map(a => a.name).join(", ")}` };
      const result = await runAgent(agent, params.prompt);
      return { agent: agent.name, output: result.output };
    }
  },
  {
    name: "create_agent",
    description: "Create a new AI agent with a name, role, and system prompt",
    parameters: { name: "string", role: "string", system_prompt: "string" },
    execute: async (params) => {
      const agent = await createAgent({
        name: params.name,
        role: params.role,
        system_prompt: params.system_prompt,
        model: "gpt-4.1-mini",
        status: "active"
      });
      return { created: true, agent: agent?.[0]?.name || params.name };
    }
  },
  {
    name: "search_knowledge",
    description: "Search the knowledge base for SOPs, prompts, client data, or research",
    parameters: { query: "string" },
    execute: async (params) => {
      const items = await getKnowledge();
      const q = params.query.toLowerCase();
      const matches = items.filter(item => {
        const text = [item.title, item.content, item.type, ...(item.tags || [])].join(" ").toLowerCase();
        return text.includes(q);
      }).slice(0, 5);
      return { results: matches.map(m => ({ title: m.title, type: m.type, content: m.content?.slice(0, 200) })) };
    }
  },
  {
    name: "add_knowledge",
    description: "Add new knowledge to the knowledge base (SOP, prompt, client data, research)",
    parameters: { title: "string", type: "string", content: "string", tags: "string" },
    execute: async (params) => {
      await createKnowledge({
        title: params.title,
        type: params.type || "SOP",
        content: params.content,
        tags: params.tags ? params.tags.split(",").map(t => t.trim()) : [],
        agent_id: null
      });
      return { created: true, title: params.title };
    }
  },
  {
    name: "list_projects",
    description: "List all projects with their names, descriptions, and status",
    parameters: {},
    execute: async () => {
      const projects = await getProjects();
      return { projects: projects.map(p => ({ name: p.name, description: p.description, status: p.status })) };
    }
  },
  {
    name: "create_project",
    description: "Create a new project with name, description, and optional GitHub repo",
    parameters: { name: "string", description: "string", github_repo: "string" },
    execute: async (params) => {
      await createProject({
        name: params.name,
        description: params.description,
        github_repo: params.github_repo || "",
        status: "Active"
      });
      return { created: true, project: params.name };
    }
  },
  {
    name: "list_workflows",
    description: "List all workflows with their names and descriptions",
    parameters: {},
    execute: async () => {
      const workflows = await getWorkflows();
      return { workflows: workflows.map(w => ({ name: w.name, description: w.description, trigger: w.trigger })) };
    }
  },
  {
    name: "create_workflow",
    description: "Create a new automation workflow with a name, description, and trigger",
    parameters: { name: "string", description: "string", trigger: "string" },
    execute: async (params) => {
      await createWorkflow({
        name: params.name,
        description: params.description,
        trigger: params.trigger || "manual"
      });
      return { created: true, workflow: params.name };
    }
  },
  {
    name: "get_analytics",
    description: "Get platform analytics: total runs, tokens used, cost, and active agents",
    parameters: {},
    execute: async () => {
      const data = await getAnalytics();
      return { runs: data.runs, tokens: data.tokens, cost: data.cost, agents_active: data.byAgent?.length || 0 };
    }
  },
  {
    name: "get_activity",
    description: "Get recent platform activity logs",
    parameters: { limit: "number" },
    execute: async (params) => {
      const logs = await getActivityLogs();
      const limited = logs.slice(0, params.limit || 10);
      return { activities: limited.map(l => ({ action: l.action, agent: l.metadata?.agent_name, time: l.created_at })) };
    }
  },
  {
    name: "create_content_asset",
    description: "Create a content asset that triggers AI post generation via Make.com. Use for social media campaigns.",
    parameters: { title: "string", category: "string", description: "string", content_type: "string" },
    execute: async (params) => {
      await createContentAsset({
        title: params.title,
        category: params.category || "Social Media",
        content_type: params.content_type || "Article",
        description: params.description,
        priority: "High"
      });
      return { created: true, asset: params.title, note: "AI generation triggered via Make.com" };
    }
  },
  {
    name: "list_social_posts",
    description: "List recent social media posts with their status and platform",
    parameters: { status: "string" },
    execute: async (params) => {
      const posts = await getGeneratedPosts();
      let filtered = posts;
      if (params.status) {
        filtered = posts.filter(p => p.status?.toLowerCase() === params.status.toLowerCase());
      }
      return { posts: filtered.slice(0, 10).map(p => ({ title: p.title, platform: p.platform, status: p.status })) };
    }
  },
  {
    name: "list_workspaces",
    description: "List all workspaces",
    parameters: {},
    execute: async () => {
      const ws = await getWorkspaces();
      return { workspaces: ws.map(w => ({ name: w.name, description: w.description })) };
    }
  },
  {
    name: "create_workspace",
    description: "Create a new workspace for organizing projects and operations",
    parameters: { name: "string", description: "string" },
    execute: async (params) => {
      await createWorkspace({ name: params.name, description: params.description || "" });
      return { created: true, workspace: params.name };
    }
  }
];

export function getToolDefinitions() {
  return TOOLS.map(t => ({
    name: t.name,
    description: t.description,
    parameters: t.parameters
  }));
}

export function getTool(name) {
  return TOOLS.find(t => t.name === name);
}
