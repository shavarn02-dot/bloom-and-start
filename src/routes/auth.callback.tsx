import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/auth/callback")({
  component: AuthCallback,
});

function AuthCallback() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Supabase reads the hash/query params from the URL automatically
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      if (error || !session) {
        // Try exchanging the code from URL params
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        if (code) {
          const { data, error: exchErr } = await supabase.auth.exchangeCodeForSession(code);
          if (exchErr || !data.session) {
            setError(exchErr?.message || "Authentication failed. Please try again.");
            return;
          }
          const user = data.session.user;
          localStorage.setItem("leadgen_user_name", user.user_metadata?.["full_name"] || user.email || "User");
          localStorage.setItem("leadgen_user_email", user.email || "");
          window.location.href = "/app";
          return;
        }
        setError(error?.message || "No session found. Please try logging in again.");
        return;
      }

      // Session already exists
      const user = session.user;
      localStorage.setItem("leadgen_user_name", user.user_metadata?.["full_name"] || user.email || "User");
      localStorage.setItem("leadgen_user_email", user.email || "");
      window.location.href = "/app";
    });
  }, []);


  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-sm text-center space-y-4">
          <p className="text-destructive font-medium">{error}</p>
          <a
            href="/login"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Back to login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <Loader2 className="size-6 animate-spin text-primary" />
        <p className="text-sm">Signing you in...</p>
      </div>
    </div>
  );
}
