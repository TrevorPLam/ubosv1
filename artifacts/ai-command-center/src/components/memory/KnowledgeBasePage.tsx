import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, FileText, Database, Code, FolderGit2 } from "lucide-react";
import { mockProjects } from "@/api/projects";

const memoryItems = [
  { id: 1, title: "Architecture Guidelines 2024", type: "document", project: "Alpha Pipeline", tags: ["rules", "architecture"] },
  { id: 2, title: "users_table_schema.sql", type: "code", project: "Data Ingestion v2", tags: ["db", "schema"] },
  { id: 3, title: "Auth Service API Specs", type: "document", project: "Security Audit", tags: ["api", "auth"] },
  { id: 4, title: "PostgreSQL Connection String", type: "secret", project: "Data Ingestion v2", tags: ["env"] },
  { id: 5, title: "OAuth2 Threat Model", type: "document", project: "Security Audit", tags: ["security", "threat-model"] },
];

export function KnowledgeBasePage() {
  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col gap-8 overflow-y-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Shared Memory</h1>
        <p className="text-muted-foreground mt-1">Context and knowledge base accessible by all agents.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {mockProjects.map(p => (
          <Card key={p.id} className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2"><FolderGit2 className="w-5 h-5 text-primary"/> {p.name}</CardTitle>
                <Badge variant={p.status === 'active' ? 'default' : 'secondary'} className="text-[10px] h-5">{p.status}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                Created {new Date(p.createdAt).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Memory Artifacts</h2>
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search memory..." className="pl-9" />
          </div>
        </div>

        <div className="border rounded-xl bg-card divide-y">
          {memoryItems.map(item => (
            <div key={item.id} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                  {item.type === 'document' ? <FileText className="w-5 h-5" /> : 
                   item.type === 'code' ? <Code className="w-5 h-5" /> : <Database className="w-5 h-5" />}
                </div>
                <div>
                  <h4 className="font-medium text-foreground">{item.title}</h4>
                  <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                    <span>{item.project}</span>
                    <span>•</span>
                    <span className="flex gap-1">
                      {item.tags.map(t => <span key={t} className="text-[10px] bg-secondary px-1.5 rounded">{t}</span>)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
