import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Palette, Search, Share2, BarChart2, FileText, ChevronRight } from "lucide-react";

const subPages = [
  {
    href: "/marketing/brand-kit",
    icon: Palette,
    label: "Brand Kit",
    description: "Central repository for brand identity, voice guidelines, templates, and digital assets.",
  },
  {
    href: "/marketing/seo",
    icon: Search,
    label: "SEO",
    description: "Keyword tracking, AI visibility monitoring, site audits, and content optimization.",
  },
  {
    href: "/marketing/socials",
    icon: Share2,
    label: "Socials",
    description: "Schedule posts, manage your unified inbox, and monitor social listening.",
  },
  {
    href: "/marketing/analytics",
    icon: BarChart2,
    label: "Analytics",
    description: "Unified dashboard, multi-touch attribution, campaign ROI, and AI-powered insights.",
  },
  {
    href: "/marketing/content-management",
    icon: FileText,
    label: "Content Management",
    description: "Content calendar, brief generator, production workflow, and content repository.",
  },
];

export function MarketingPage() {
  return (
    <div className="p-8 max-w-4xl mx-auto h-full overflow-y-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Marketing</h1>
        <p className="text-muted-foreground mt-1">Manage brand, content, SEO, social, and marketing analytics in one place.</p>
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
