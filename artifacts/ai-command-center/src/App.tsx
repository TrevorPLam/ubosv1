import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import { Sidebar } from "@/components/layout/Sidebar";
import { StatusBar } from "@/components/layout/StatusBar";
import { CommandPalette } from "@/components/layout/CommandPalette";

import { Dashboard } from "@/pages/Dashboard";
import { AgentsPage } from "@/pages/AgentsPage";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { CRMPage } from "@/components/crm/CRMPage";
import { ClientsPage } from "@/components/clients/ClientsPage";
import { WorkPage } from "@/components/work/WorkPage";
import { CalendarPage } from "@/components/calendar/CalendarPage";
import { DocumentsPage } from "@/components/documents/DocumentsPage";
import { FinancePage } from "@/components/finance/FinancePage";
import { AssetsPage } from "@/components/assets/AssetsPage";
import { CostAnalyticsPage } from "@/components/analytics/CostAnalyticsPage";
import { AuditLogPage } from "@/components/analytics/AuditLogPage";
import { KnowledgeBasePage } from "@/components/memory/KnowledgeBasePage";
import { IntegrationsPage } from "@/components/integrations/IntegrationsPage";
import { SettingsPage } from "@/components/settings/SettingsPage";
import { ExportImportPage } from "@/components/settings/ExportImportPage";
import { MarketingPage } from "@/components/marketing/MarketingPage";
import { BrandKitPage } from "@/components/marketing/BrandKitPage";
import { SEOPage } from "@/components/marketing/SEOPage";
import { SocialsPage } from "@/components/marketing/SocialsPage";
import { MarketingAnalyticsPage } from "@/components/marketing/MarketingAnalyticsPage";
import { ContentManagementPage } from "@/components/marketing/ContentManagementPage";
import { VendorsPage } from "@/components/vendors/VendorsPage";
import { VendorRecordsPage } from "@/components/vendors/VendorRecordsPage";
import { ContractAwarenessPage } from "@/components/vendors/ContractAwarenessPage";
import { PurchaseApprovalsPage } from "@/components/vendors/PurchaseApprovalsPage";
import { SpendVisibilityPage } from "@/components/vendors/SpendVisibilityPage";

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
        <Route path="/agents" component={AgentsPage} />
        <Route path="/chat" component={ChatInterface} />
        <Route path="/crm" component={CRMPage} />
        <Route path="/clients" component={ClientsPage} />
        <Route path="/work" component={WorkPage} />
        <Route path="/calendar" component={CalendarPage} />
        <Route path="/documents" component={DocumentsPage} />
        <Route path="/marketing" component={MarketingPage} />
        <Route path="/marketing/brand-kit" component={BrandKitPage} />
        <Route path="/marketing/seo" component={SEOPage} />
        <Route path="/marketing/socials" component={SocialsPage} />
        <Route path="/marketing/analytics" component={MarketingAnalyticsPage} />
        <Route path="/marketing/content-management" component={ContentManagementPage} />
        <Route path="/finance" component={FinancePage} />
        <Route path="/vendors" component={VendorsPage} />
        <Route path="/vendors/vendor-records" component={VendorRecordsPage} />
        <Route path="/vendors/contract-awareness" component={ContractAwarenessPage} />
        <Route path="/vendors/purchase-approvals" component={PurchaseApprovalsPage} />
        <Route path="/vendors/spend-visibility" component={SpendVisibilityPage} />
        <Route path="/assets" component={AssetsPage} />
        <Route path="/settings" component={SettingsPage} />
        <Route path="/settings/cost-analytics" component={CostAnalyticsPage} />
        <Route path="/settings/audit-log" component={AuditLogPage} />
        <Route path="/settings/memory" component={KnowledgeBasePage} />
        <Route path="/settings/integrations" component={IntegrationsPage} />
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
