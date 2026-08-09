import { Link, Outlet, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Target,
  Users,
  Building2,
  FileText,
  Settings,
  LogOut,
  User as UserIcon,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/app", label: "Overview", icon: LayoutDashboard, symbol: "▦", exact: true },
  { to: "/app/campaigns", label: "Campaigns", icon: Target, symbol: "◎", exact: false },
  { to: "/app/leads", label: "Leads", icon: Users, symbol: "♙", exact: false },
  { to: "/app/profiles", label: "Business Profiles", icon: Building2, symbol: "▣", exact: false },
  { to: "/app/documents", label: "Documents", icon: FileText, symbol: "▤", exact: false },
] as const;

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { title: "Workspace — LeadGen AI" },
      {
        name: "description",
        content: "Run campaigns, review scored leads and manage your business profiles in the LeadGen AI workspace.",
      },
      { property: "og:title", content: "Workspace — LeadGen AI" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AppLayout,
});

function AppLayout() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("Sarthak Shavarn");

  useEffect(() => {
    const storedUser = localStorage.getItem("leadgen_user_name");
    if (storedUser) {
      setUserName(storedUser);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("leadgen_user_name");
    localStorage.removeItem("leadgen_user_email");
    navigate({ to: "/login" });
  };

  return (
    <div className="min-h-screen bg-background md:flex">
      {/* Redesigned Sidebar */}
      <aside className="flex shrink-0 flex-col border-b border-sidebar-border bg-sidebar md:min-h-screen md:w-64 md:border-r md:border-b-0">
        
        {/* Brand Header */}
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-sidebar-border/60">
          <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
            <Search className="size-4" strokeWidth={2.5} />
          </div>
          <Link to="/app" className="text-base font-bold tracking-tight text-foreground hover:opacity-90">
            LeadGen AI
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="flex flex-col gap-1 px-3 py-4">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.exact }}
              activeProps={{
                className: "bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-xs",
              }}
              inactiveProps={{ className: "text-muted-foreground hover:text-foreground" }}
              className="group inline-flex items-center gap-3 rounded-md px-3 py-2.5 text-[13.5px] transition-colors duration-150 hover:bg-sidebar-accent"
            >
              <span className="text-[15px] font-mono opacity-80 group-hover:opacity-100">{item.symbol}</span>
              <span>{item.label}</span>
            </Link>
          ))}

          {/* Divider */}
          <div className="my-2 border-t border-sidebar-border/80" />

          {/* Settings */}
          <Link
            to="/app/settings"
            activeProps={{
              className: "bg-sidebar-accent text-sidebar-accent-foreground font-semibold",
            }}
            inactiveProps={{ className: "text-muted-foreground hover:text-foreground" }}
            className="group inline-flex items-center gap-3 rounded-md px-3 py-2.5 text-[13.5px] transition-colors duration-150 hover:bg-sidebar-accent"
          >
            <Settings className="size-4" strokeWidth={1.8} />
            <span>Settings</span>
          </Link>
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Bottom User Info & Logout Section */}
        <div className="border-t border-sidebar-border p-3 space-y-2">
          <div className="flex items-center gap-3 rounded-md px-3 py-2 bg-paper/60 border border-sidebar-border/40">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-xs">
              <UserIcon className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-foreground">{userName}</p>
              <span className="inline-block rounded bg-emerald-100 px-1.5 py-0.2 text-[10px] font-bold tracking-wider text-emerald-800 uppercase">
                Free plan
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full inline-flex items-center justify-center gap-2 rounded-md border border-sidebar-border/80 bg-background px-3 py-2 text-[12.5px] font-medium text-red-600 transition-colors hover:bg-red-50 hover:text-red-700"
          >
            <LogOut className="size-3.5" />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="min-w-0 flex-1 px-5 py-8 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-5xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
