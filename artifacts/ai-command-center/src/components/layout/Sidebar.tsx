import { useLocation, Link } from "wouter";
import { LayoutDashboard, MessageSquare, KanbanSquare, LineChart, FileText, Database, Blocks, Settings, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/uiStore";
import { useAttentionQueue } from "@/hooks/useAttentionQueue";

export function Sidebar() {
  const [location] = useLocation();
  const { sidebarCollapsed } = useUIStore();
  const { count } = useAttentionQueue();

  const navItems = [
    { href: "/", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/chat", icon: MessageSquare, label: "Chat" },
    { href: "/work", icon: KanbanSquare, label: "Work" },
    { href: "/analytics/cost", icon: LineChart, label: "Cost Analytics" },
    { href: "/analytics/audit", icon: Activity, label: "Audit Log" },
    { href: "/memory", icon: Database, label: "Memory" },
    { href: "/integrations", icon: Blocks, label: "Integrations" },
    { href: "/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <div
      className={cn(
        "flex flex-col border-r bg-sidebar border-sidebar-border transition-all duration-300",
        sidebarCollapsed ? "w-16" : "w-64"
      )}
    >
      <div className="h-14 flex items-center justify-between px-4 border-b border-sidebar-border">
        {!sidebarCollapsed && <span className="font-semibold text-sidebar-foreground truncate">Command Center</span>}
        <div className="w-6 h-6 rounded bg-primary flex items-center justify-center text-primary-foreground mx-auto">
          <Activity className="w-4 h-4" />
        </div>
      </div>

      <nav className="flex-1 py-4 flex flex-col gap-1 px-2">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md transition-colors relative group",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
              aria-label={item.label}
              data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {!sidebarCollapsed && (
                <span className="text-sm font-medium truncate">{item.label}</span>
              )}
              
              {/* Attention Queue Badge */}
              {item.href === "/" && count > 0 && (
                <div className={cn(
                  "absolute flex items-center justify-center bg-amber-500 text-amber-950 font-bold rounded-full text-[10px]",
                  sidebarCollapsed ? "top-1 right-1 w-3.5 h-3.5" : "right-3 w-5 h-5"
                )}>
                  {!sidebarCollapsed ? count : ""}
                </div>
              )}

              {/* Tooltip for collapsed state */}
              {sidebarCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                  {item.label}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-sidebar-accent">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
          </div>
          {!sidebarCollapsed && (
            <div className="flex flex-col">
              <span className="text-xs font-medium text-sidebar-foreground">System Online</span>
              <span className="text-[10px] text-sidebar-foreground/50">All services operational</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
