import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import { Sidebar } from "@/components/layout/Sidebar";
import { StatusBar } from "@/components/layout/StatusBar";
import { CommandPalette } from "@/components/layout/CommandPalette";

import { Dashboard } from "@/pages/Dashboard";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { WorkPage } from "@/components/work/WorkPage";
import { CalendarPage } from "@/components/calendar/CalendarPage";
import { CostAnalyticsPage } from "@/components/analytics/CostAnalyticsPage";
import { AuditLogPage } from "@/components/analytics/AuditLogPage";
import { KnowledgeBasePage } from "@/components/memory/KnowledgeBasePage";
import { IntegrationsPage } from "@/components/integrations/IntegrationsPage";
import { SettingsPage } from "@/components/settings/SettingsPage";
import { ExportImportPage } from "@/components/settings/ExportImportPage";

const queryClient = new QueryClient();

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-full bg-background overflow-hidden font-sans text-foreground selection:bg-primary/30">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <main className="flex-1 relative min-w-0 overflow-hidden">
          {children}
        </main>
        <StatusBar />
      </div>
      <CommandPalette />
    </div>
  );
}

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/chat" component={ChatInterface} />
        <Route path="/work" component={WorkPage} />
        <Route path="/calendar" component={CalendarPage} />
        <Route path="/analytics/cost" component={CostAnalyticsPage} />
        <Route path="/analytics/audit" component={AuditLogPage} />
        <Route path="/memory" component={KnowledgeBasePage} />
        <Route path="/integrations" component={IntegrationsPage} />
        <Route path="/settings" component={SettingsPage} />
        <Route path="/settings/export" component={ExportImportPage} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
