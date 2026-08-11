import { Link, Outlet, createFileRoute, useNavigate, useRouterState } from "@tanstack/react-router";
// LeadGen AI App Layout — v2.5 Clean Build
import { useEffect, useRef, useState } from "react";
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
import { LeadFlowXLogo } from "@/components/leadgen/logo";

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
  const navRef = useRef<HTMLElement>(null);

  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const activeIndex = navItems.findIndex((item) =>
    item.exact ? pathname === item.to : pathname.startsWith(item.to),
  );

  useEffect(() => {
    // Check Supabase session first for real Google user details
    import("@/lib/supabase").then(({ supabase }) => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          const name = session.user.user_metadata?.["full_name"] || session.user.email || "User";
          setUserName(name);
          localStorage.setItem("leadgen_user_name", name);
          localStorage.setItem("leadgen_user_email", session.user.email || "");
          return;
        }
        const storedUser = localStorage.getItem("leadgen_user_name");
        if (storedUser) {
          setUserName(storedUser);
        } else {
          // No user session found — redirect to login
          navigate({ to: "/login" });
        }
      });
    });
  }, [navigate]);

  const handleLogout = async () => {
    const { supabase } = await import("@/lib/supabase");
    await supabase.auth.signOut();
    localStorage.removeItem("leadgen_user_name");
    localStorage.removeItem("leadgen_user_email");
    navigate({ to: "/login" });
  };

  const activeLink = navRef.current?.children[activeIndex] as HTMLElement | undefined;
  const indicatorTop = activeLink?.offsetTop ?? 0;
  const indicatorHeight = activeLink?.offsetHeight ?? 0;

  return (
    <div className="min-h-screen bg-background md:flex">
      {/* Redesigned Sidebar */}
      <aside className="flex shrink-0 flex-col border-b border-sidebar-border bg-sidebar md:min-h-screen md:w-64 md:border-r md:border-b-0">
        
        {/* Brand Header */}
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-sidebar-border/60">
          <Link to="/app" className="hover:opacity-90 transition-opacity">
            <LeadFlowXLogo size="md" />
          </Link>
        </div>

        {/* Navigation Links */}
        <nav ref={navRef} className="relative flex flex-col gap-1 px-3 py-4">
          {/* Sliding active indicator */}
          <span
            className="sidebar-indicator pointer-events-none absolute left-3 right-3 rounded-md bg-sidebar-accent"
            style={{
              top: indicatorTop,
              height: indicatorHeight,
              opacity: indicatorHeight > 0 ? 1 : 0,
            }}
            aria-hidden="true"
          />

          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.exact }}
              className="group relative z-10 inline-flex items-center gap-3 rounded-md px-3 py-2.5 text-[13.5px] transition-colors duration-200 hover:bg-sidebar-accent/50"
            >
              <span className="text-[15px] font-mono opacity-70 transition-opacity duration-200 group-hover:opacity-100">
                {item.symbol}
              </span>
              <span className={cn(
                "transition-colors duration-200",
                pathname === item.to || (item.exact && pathname === item.to) || (!item.exact && pathname.startsWith(item.to))
                  ? "text-sidebar-accent-foreground font-semibold"
                  : "text-muted-foreground group-hover:text-foreground",
              )}>
                {item.label}
              </span>
            </Link>
          ))}

          {/* Divider */}
          <div className="my-2 border-t border-sidebar-border/80" />

          {/* Settings */}
          <Link
            to="/app/settings"
            className={cn(
              "group relative z-10 inline-flex items-center gap-3 rounded-md px-3 py-2.5 text-[13.5px] transition-colors duration-200 hover:bg-sidebar-accent/50",
              pathname.startsWith("/app/settings") ? "text-sidebar-accent-foreground font-semibold" : "text-muted-foreground group-hover:text-foreground",
            )}
          >
            <Settings className="size-4" strokeWidth={1.8} />
            <span>Settings</span>
          </Link>
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Bottom User Info & Logout Section */}
        <div className="border-t border-sidebar-border p-3 space-y-2">
          <div className="flex items-center gap-3 rounded-md px-3 py-2 bg-paper/60 border border-sidebar-border/40 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-paper)]">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-xs">
              <UserIcon className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-foreground">{userName}</p>
              <span className="inline-block rounded bg-success px-1.5 py-0.2 text-[10px] font-bold tracking-wider text-success-foreground uppercase">
                Free plan
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full inline-flex items-center justify-center gap-2 rounded-md border border-sidebar-border/80 bg-background px-3 py-2 text-[12.5px] font-medium text-destructive transition-all duration-200 hover:bg-destructive-soft hover:text-destructive hover:-translate-y-0.5"
          >
            <LogOut className="size-3.5" />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="min-w-0 flex-1 px-5 py-8 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-5xl animate-page-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
