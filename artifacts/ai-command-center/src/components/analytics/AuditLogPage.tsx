import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import { formatDate } from "@/lib/formatters";

const mockAuditLogs = Array.from({ length: 25 }).map((_, i) => ({
  id: `log-${i}`,
  timestamp: new Date(Date.now() - i * 3600000).toISOString(),
  agent: ["Orchestrator", "CodeReviewer", "DataAnalyst", "ResearchBot"][i % 4],
  action: ["git_commit", "deploy_trigger", "sql_exec", "read_file", "api_call"][i % 5],
  status: i % 7 === 0 ? "failed" : "success",
  details: "Executed command successfully.",
}));

export function AuditLogPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Audit Log</h1>
        <p className="text-muted-foreground mt-1">Immutable record of all agent actions and system events.</p>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search logs..." className="pl-9 bg-card" />
        </div>
      </div>

      <div className="border rounded-md bg-card flex-1 overflow-auto">
        <Table>
          <TableHeader className="bg-muted/50 sticky top-0 z-10">
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>Agent</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockAuditLogs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="text-muted-foreground whitespace-nowrap font-mono text-xs">
                  {formatDate(log.timestamp)}
                </TableCell>
                <TableCell className="font-medium">{log.agent}</TableCell>
                <TableCell>
                  <code className="bg-muted px-1.5 py-0.5 rounded text-xs">{log.action}</code>
                </TableCell>
                <TableCell>
                  <Badge variant={log.status === 'success' ? 'default' : 'destructive'} className={log.status === 'success' ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20 shadow-none border-0' : ''}>
                    {log.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{log.details}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
