import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AuthShell } from "@/components/auth/auth-shell";
import {
  Divider,
  Field,
  GoogleButton,
  PasswordInput,
  SubmitButton,
  emailPattern,
} from "@/components/auth/auth-form";
import { Input } from "@/components/ui/input";
import { HandUnderline } from "@/components/leadgen/marks";

const title = "Log in to LeadFlowX";
const description =
  "Log in to LeadFlowX to pick up your lead research where you left off.";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const next: { email?: string; password?: string } = {};
    if (!email.trim()) next.email = "This field is required.";
    else if (!emailPattern.test(email)) next.email = "Enter a valid email address.";
    if (!password) next.password = "This field is required.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setLoading(true);
    setTimeout(() => navigate({ to: "/app" }), 700);
  }

  return (
    <AuthShell>
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        <HandUnderline>Welcome back.</HandUnderline>
      </h1>
      <p className="mt-3 text-muted-foreground">Pick up where you left off.</p>

      <div className="mt-8">
        <GoogleButton />
        <Divider />

        <form onSubmit={onSubmit} noValidate className="space-y-5">
          <Field id="email" label="Email" {...(errors.email ? { error: errors.email } : {})}>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              autoComplete="email"
              aria-invalid={Boolean(errors.email)}
              className="h-12 bg-paper"
            />
          </Field>

          <Field
            id="password"
            label="Password"
            {...(errors.password ? { error: errors.password } : {})}
          >
            <PasswordInput
              id="password"
              value={password}
              onChange={setPassword}
              placeholder="Your password"
              invalid={Boolean(errors.password)}
            />
          </Field>

          <div className="flex justify-end">
            <Link
              to="/forgot-password"
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          <SubmitButton loading={loading} loadingLabel="Logging you in...">
            Log in
          </SubmitButton>
        </form>

        <p className="mt-6 text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link
            to="/register"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Create one
          </Link>
        </p>

        <p className="mt-8 text-xs leading-relaxed text-muted-foreground">
          By continuing you agree to the LeadFlowX Terms and Privacy Policy.
        </p>
      </div>
    </AuthShell>
  );
}
