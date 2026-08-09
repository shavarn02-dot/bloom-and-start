import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AuthShell } from "@/components/auth/auth-shell";
import {
  Field,
  SubmitButton,
  SuccessNote,
  emailPattern,
} from "@/components/auth/auth-form";
import { Input } from "@/components/ui/input";

const title = "Reset your LeadGen AI password";
const description = "Request a password reset link for your LeadGen AI account.";

export const Route = createFileRoute("/forgot-password")({
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
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!email.trim()) return setError("This field is required.");
    if (!emailPattern.test(email)) return setError("Enter a valid email address.");
    setError("");
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSent(true);
    }, 800);
  }

  return (
    <AuthShell>
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        Reset your password.
      </h1>
      <p className="mt-3 text-muted-foreground">
        Enter the email you use for LeadGen AI and we&apos;ll send you a reset link.
      </p>

      <form onSubmit={onSubmit} noValidate className="mt-8 space-y-5">
        <Field id="email" label="Email" {...(error ? { error } : {})}>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            autoComplete="email"
            aria-invalid={Boolean(error)}
            className="h-12 bg-paper"
          />
        </Field>

        {sent ? (
          <SuccessNote>Check your inbox for a password reset link.</SuccessNote>
        ) : (
          <SubmitButton loading={loading} loadingLabel="Sending link...">
            Send reset link
          </SubmitButton>
        )}
      </form>

      <p className="mt-6 text-sm text-muted-foreground">
        <Link
          to="/login"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Back to login
        </Link>
      </p>
    </AuthShell>
  );
}
