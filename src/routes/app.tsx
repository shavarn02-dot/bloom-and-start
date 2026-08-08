import { Link, Outlet, createFileRoute } from "@tanstack/react-router";
import {
  Building2,
  FileText,
  LayoutDashboard,
  Settings,
  Target,
  Users,
} from "lucide-react";
import { Wordmark } from "@/components/leadgen/wordmark";

const nav = [
  { to: "/app", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/app/campaigns", label: "Campaigns", icon: Target, exact: false },
  { to: "/app/leads", label: "Leads", icon: Users, exact: false },
  { to: "/app/profiles", label: "Business Profiles", icon: Building2, exact: false },
  { to: "/app/documents", label: "Documents", icon: FileText, exact: false },
  { to: "/app/settings", label: "Settings", icon: Settings, exact: false },
] as const;

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { title: "Workspace — LeadGen AI" },
      {
        name: "description",
        content:
          "Run campaigns, review scored leads and manage your business profiles in the LeadGen AI workspace.",
      },
      { property: "og:title", content: "Workspace — LeadGen AI" },
      {
        property: "og:description",
        content: "Campaigns, leads and business profiles in one focused workspace.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AppLayout,
});

function AppLayout() {
  return (
    <div className="min-h-screen bg-background md:flex">
      <aside className="flex shrink-0 flex-col border-b border-sidebar-border bg-sidebar md:min-h-screen md:w-60 md:border-r md:border-b-0">
        <div className="flex items-center justify-between px-4 py-4">
          <Link to="/" aria-label="LeadGen AI home">
            <Wordmark />
          </Link>
        </div>

        <nav className="flex gap-1 overflow-x-auto px-2 pb-3 md:flex-col md:overflow-visible md:pb-0">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.exact }}
              activeProps={{
                className:
                  "bg-sidebar-accent text-sidebar-accent-foreground font-medium",
              }}
              inactiveProps={{ className: "text-muted-foreground" }}
              className="inline-flex shrink-0 items-center gap-2.5 rounded-md px-3 py-2 text-[13.5px] transition-colors duration-150 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <item.icon className="size-4" strokeWidth={1.8} />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto hidden border-t border-sidebar-border p-3 md:block">
          <Link
            to="/app/settings"
            className="flex items-center gap-2.5 rounded-md px-2 py-2 transition-colors hover:bg-sidebar-accent"
          >
            <span className="inline-flex size-7 items-center justify-center rounded-full bg-primary-soft text-[11px] font-semibold text-primary">
              AR
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[13px] font-medium text-sidebar-foreground">
                Your account
              </span>
              <span className="block truncate text-[11.5px] text-muted-foreground">
                Free plan
              </span>
            </span>
          </Link>
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-5 py-8 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-5xl">
          {/* Required: nested workspace routes render here. */}
          <Outlet />
        </div>
      </main>
    </div>
  );
}
