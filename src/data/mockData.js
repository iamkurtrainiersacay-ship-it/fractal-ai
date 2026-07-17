export const agents = [
  {
    id: 1,
    name: "Sales Agent",
    role: "Qualifies leads and books calls",
    status: "Active",
    model: "GPT-5.5",
    tools: ["Gmail", "CRM", "Calendar"],
    knowledge: ["Sales SOP", "Client Profiles"]
  },
  {
    id: 2,
    name: "Research Agent",
    role: "Finds market and company intelligence",
    status: "Active",
    model: "GPT-5.5",
    tools: ["Web Search", "Documents"],
    knowledge: ["Research Library"]
  },
  {
    id: 3,
    name: "Content Agent",
    role: "Creates posts, campaigns, and assets",
    status: "Standby",
    model: "GPT-5.4-mini",
    tools: ["WordPress", "Social Scheduler"],
    knowledge: ["Brand Voice", "Content Assets"]
  }
];

export const projects = [
  {
    id: 1,
    name: "Fractal Core",
    description: "Main AI operations platform",
    status: "Building",
    github: "",
    commands: ["npm run dev", "npm run build"]
  },
  {
    id: 2,
    name: "Social Distribution Engine",
    description: "AI social media generation system",
    status: "Active",
    github: "",
    commands: ["npm run dev"]
  },
  {
    id: 3,
    name: "Lead Generation System",
    description: "Automated lead research and outreach",
    status: "Planning",
    github: "",
    commands: []
  }
];

export const workflows = [
  "Lead Capture ? Qualification ? CRM",
  "Content Asset ? AI Posts ? Approval",
  "Client Inquiry ? Receptionist ? Booking",
  "Research ? Report ? Email Summary"
];

export const integrations = ["OpenAI", "Supabase", "Gmail", "WordPress", "Make.com", "Zoho", "Discord", "Claude"];

export const knowledge = ["Sales SOP", "Client Profiles", "Research Library", "Brand Voice", "Content Assets"];

export const activityLogs = [
  "Fractal project recreated",
  "Agent registry initialized",
  "Project registry initialized",
  "Supabase package installed"
];
