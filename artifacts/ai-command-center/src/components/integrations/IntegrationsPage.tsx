import { MCPServerCard, MCPServer } from "./MCPServerCard";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const mockServers: MCPServer[] = [
  {
    id: "mcp-1",
    name: "Filesystem Access",
    description: "Provides agents with read/write access to the local project workspace.",
    status: "connected",
    trustTier: "trusted",
    tools: ["read_file", "write_file", "list_dir", "search_files"]
  },
  {
    id: "mcp-2",
    name: "PostgreSQL Prod",
    description: "Read-only access to production database for analytics.",
    status: "connected",
    trustTier: "restricted",
    tools: ["sql_query", "list_tables", "describe_schema"]
  },
  {
    id: "mcp-3",
    name: "GitHub Integration",
    description: "Manage PRs, issues, and repository state.",
    status: "connected",
    trustTier: "trusted",
    tools: ["create_pr", "review_code", "comment_issue"]
  },
  {
    id: "mcp-4",
    name: "AWS Deployment",
    description: "Manage AWS resources and trigger deployments.",
    status: "disconnected",
    trustTier: "restricted",
    tools: ["deploy_lambda", "check_status", "rollback"]
  }
];

export function IntegrationsPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">MCP Integrations</h1>
          <p className="text-muted-foreground mt-1">Manage Model Context Protocol servers available to your agents.</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" /> Add Server
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockServers.map(s => (
          <MCPServerCard key={s.id} server={s} />
        ))}
      </div>
    </div>
  );
}
