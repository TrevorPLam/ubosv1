/**
 * @file        artifacts/ai-command-center/src/App.tsx
 * @module      AI Command Center / Core
 * @purpose     Main React application component with routing and layout structure
 *
 * @ai_instructions
 *   - All route paths must be unique and follow RESTful conventions.
 *   - Layout components must wrap all page components.
 *   - QueryClient provider must be at the root level.
 *   - DO NOT add routes without updating the Sidebar component.
 *
 * @exports     App component
 * @imports     wouter, @tanstack/react-query, @/components/ui/toaster, @/components/ui/tooltip, @/components/layout/*, @/pages/*, @/components/*
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@clerk/react";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import { useEffect } from "react";
import NotFound from "@/pages/not-found";

import { Sidebar } from "@/components/layout/Sidebar";
import { StatusBar } from "@/components/layout/StatusBar";
import { CommandPalette } from "@/components/layout/CommandPalette";

import { Dashboard } from "@/pages/Dashboard";
import { AgentsPage } from "@/pages/AgentsPage";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { EmailInboxPage } from "@/pages/EmailInboxPage";
import { CRMPage } from "@/components/crm/CRMPage";
import { ContactsPage } from "@/components/crm/ContactsPage";
import { PipelinePage } from "@/components/crm/PipelinePage";
import { AgreementsPage } from "@/components/crm/AgreementsPage";
import { EmailPage } from "@/components/crm/EmailPage";
import { SMSPage } from "@/components/crm/SMSPage";
import { CRMAnalyticsPage } from "@/components/crm/CRMAnalyticsPage";
import { ClientsPage } from "@/components/clients/ClientsPage";
import { ClientDetailPage } from "@/components/clients/ClientDetailPage";
import { WorkPage } from "@/components/work/WorkPage";
import { CalendarPage } from "@/components/calendar/CalendarPage";
import { DocumentsPage } from "@/components/documents/DocumentsPage";
import { FinancePage } from "@/components/finance/FinancePage";
import { OverviewPage } from "@/components/finance/OverviewPage";
import { ChartOfAccountsPage } from "@/components/finance/ChartOfAccountsPage";
import { TransactionsPage } from "@/components/finance/TransactionsPage";
import { InvoicesPage } from "@/components/finance/InvoicesPage";
import { BillsPage } from "@/components/finance/BillsPage";
import { JournalEntriesPage } from "@/components/finance/JournalEntriesPage";
import { ReportsPage } from "@/components/finance/ReportsPage";
import { BudgetPage } from "@/components/finance/BudgetPage";
import { GoalsPage } from "@/components/finance/GoalsPage";
import { AssetsPage } from "@/components/assets/AssetsPage";
import { KnowledgePage } from "@/components/knowledge/KnowledgePage";
import { SOPsPage } from "@/components/knowledge/SOPsPage";
import { WikiPage } from "@/components/knowledge/WikiPage";
import { TrainingPage } from "@/components/knowledge/TrainingPage";
import { CertificationsPage } from "@/components/knowledge/CertificationsPage";
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
import { TeamPage } from "@/components/team/TeamPage";
import { DirectoryPage } from "@/components/team/DirectoryPage";
import { OnboardingPage } from "@/components/team/OnboardingPage";
import { OffboardingPage } from "@/components/team/OffboardingPage";
import { TimeOffPage } from "@/components/team/TimeOffPage";
import { TeamDocumentsPage } from "@/components/team/TeamDocumentsPage";
import { ComplianceTrackingPage } from "@/components/team/ComplianceTrackingPage";
import { VendorsPage } from "@/components/vendors/VendorsPage";
import { VendorRecordsPage } from "@/components/vendors/VendorRecordsPage";
import { ContractAwarenessPage } from "@/components/vendors/ContractAwarenessPage";
import { PurchaseApprovalsPage } from "@/components/vendors/PurchaseApprovalsPage";
import { SpendVisibilityPage } from "@/components/vendors/SpendVisibilityPage";

const queryClient = new QueryClient();

/**
 * Component to configure Clerk auth token for API calls
 */
function AuthTokenProvider({ children }: { children: React.ReactNode }) {
  const { getToken } = useAuth();

  useEffect(() => {
    // Configure the API client to use Clerk's session token
    setAuthTokenGetter(async () => {
      try {
        const token = await getToken();
        return token;
      } catch (error) {
        console.error("Failed to get auth token:", error);
        return null;
      }
    });
  }, [getToken]);

  return <>{children}</>;
}

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
        <Route path="/email" component={EmailInboxPage} />
        <Route path="/crm" component={CRMPage} />
        <Route path="/crm/contacts" component={ContactsPage} />
        <Route path="/crm/pipeline" component={PipelinePage} />
        <Route path="/crm/agreements" component={AgreementsPage} />
        <Route path="/crm/email" component={EmailPage} />
        <Route path="/crm/sms" component={SMSPage} />
        <Route path="/crm/analytics" component={CRMAnalyticsPage} />
        <Route path="/clients" component={ClientsPage} />
        <Route path="/clients/:id" component={ClientDetailPage} />
        <Route path="/work" component={WorkPage} />
        <Route path="/calendar" component={CalendarPage} />
        <Route path="/documents" component={DocumentsPage} />
        <Route path="/marketing" component={MarketingPage} />
        <Route path="/marketing/brand-kit" component={BrandKitPage} />
        <Route path="/marketing/seo" component={SEOPage} />
        <Route path="/marketing/socials" component={SocialsPage} />
        <Route path="/marketing/analytics" component={MarketingAnalyticsPage} />
        <Route path="/marketing/content-management" component={ContentManagementPage} />
        <Route path="/team" component={TeamPage} />
        <Route path="/team/directory" component={DirectoryPage} />
        <Route path="/team/onboarding" component={OnboardingPage} />
        <Route path="/team/offboarding" component={OffboardingPage} />
        <Route path="/team/time-off" component={TimeOffPage} />
        <Route path="/team/documents" component={TeamDocumentsPage} />
        <Route path="/team/compliance" component={ComplianceTrackingPage} />
        <Route path="/finance" component={FinancePage} />
        <Route path="/finance/overview" component={OverviewPage} />
        <Route path="/finance/chart-of-accounts" component={ChartOfAccountsPage} />
        <Route path="/finance/transactions" component={TransactionsPage} />
        <Route path="/finance/invoices" component={InvoicesPage} />
        <Route path="/finance/bills" component={BillsPage} />
        <Route path="/finance/journal-entries" component={JournalEntriesPage} />
        <Route path="/finance/reports" component={ReportsPage} />
        <Route path="/finance/budget" component={BudgetPage} />
        <Route path="/finance/goals" component={GoalsPage} />
        <Route path="/vendors" component={VendorsPage} />
        <Route path="/vendors/vendor-records" component={VendorRecordsPage} />
        <Route path="/vendors/contract-awareness" component={ContractAwarenessPage} />
        <Route path="/vendors/purchase-approvals" component={PurchaseApprovalsPage} />
        <Route path="/vendors/spend-visibility" component={SpendVisibilityPage} />
        <Route path="/assets" component={AssetsPage} />
        <Route path="/knowledge" component={KnowledgePage} />
        <Route path="/knowledge/sops" component={SOPsPage} />
        <Route path="/knowledge/wiki" component={WikiPage} />
        <Route path="/knowledge/training" component={TrainingPage} />
        <Route path="/knowledge/certifications" component={CertificationsPage} />
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
        <AuthTokenProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
        </AuthTokenProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
