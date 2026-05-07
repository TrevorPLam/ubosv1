import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, FileSearch, ClipboardCheck, BarChart2, ChevronRight } from "lucide-react";

const subPages = [
  {
    href: "/vendors/vendor-records",
    icon: Building2,
    label: "Vendor Records",
    description: "Supplier profiles with contacts, payment terms, account numbers, documents, and full interaction history.",
  },
  {
    href: "/vendors/contract-awareness",
    icon: FileSearch,
    label: "Contract Awareness",
    description: "Key contract dates tracked with automated flags before renewals hit and documents attached to vendor records.",
  },
  {
    href: "/vendors/purchase-approvals",
    icon: ClipboardCheck,
    label: "Purchase Approvals",
    description: "Submit purchase requests, route for approval, generate purchase orders, and match against incoming bills.",
  },
  {
    href: "/vendors/spend-visibility",
    icon: BarChart2,
    label: "Spend Visibility",
    description: "Real-time view of approved, ordered, and paid amounts by vendor and time period — no waiting for month-end.",
  },
];

export function VendorsPage() {
  return (
    <div className="p-8 max-w-4xl mx-auto h-full overflow-y-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Vendors</h1>
        <p className="text-muted-foreground mt-1">Manage supplier relationships, contracts, purchase approvals, and spend in one place.</p>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Modules</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {subPages.map((page) => (
            <Link key={page.href} href={page.href}>
              <Card className="cursor-pointer hover:bg-accent/50 transition-colors group">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="flex items-center justify-center w-9 h-9 rounded-md bg-muted shrink-0">
                    <page.icon className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-none mb-1">{page.label}</p>
                    <p className="text-xs text-muted-foreground truncate">{page.description}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
