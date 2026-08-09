import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AuthShell } from "@/components/auth/auth-shell";
import {
  Divider,
  Field,
  GoogleButton,
  PasswordInput,
  SubmitButton,
  SuccessNote,
  emailPattern,
} from "@/components/auth/auth-form";
import { Input } from "@/components/ui/input";
import { HandUnderline } from "@/components/leadgen/marks";

const title = "Create your LeadGen AI account";
const description =
  "Create a LeadGen AI account and start finding the people your business should be talking to.";

export const Route = createFileRoute("/register")({
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
  component: RegisterPage;
});

function RegisterPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "This field is required.";
    if (!email.trim()) next.email = "This field is required.";
    else if (!emailPattern.test(email)) next.email = "Enter a valid email address.";
    if (password.length < 8) next.password = "Use at least 8 characters.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setDone(true);
      setTimeout(() => navigate({ to: "/app" }), 900);
    }, 800);
  }

  return (
    <AuthShell>
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        Create your <HandUnderline>LeadGen account.</HandUnderline>
      </h1>
      <p className="mt-3 text-muted-foreground">
        Start finding the people your business should be talking to.
      </p>

      <div className="mt-8">
        <GoogleButton label="Continue with Google" />
        <Divider />

        <form onSubmit={onSubmit} noValidate className="space-y-5">
          <Field id="name" label="Full name" {...(errors.name ? { error: errors.name } : {})}>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              autoComplete="name"
              aria-invalid={Boolean(errors.name)}
              className="h-12 bg-paper"
            />
          </Field>

          <Field id="email" label="Work email" {...(errors.email ? { error: errors.email } : {})}>
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
              placeholder="Create a password"
              invalid={Boolean(errors.password)}
            />
            <p className="text-xs text-muted-foreground">At least 8 characters.</p>
          </Field>

          {done ? (
            <SuccessNote>You&apos;re in.</SuccessNote>
          ) : (
            <SubmitButton loading={loading} loadingLabel="Creating your account...">
              Create account
            </SubmitButton>
          )}
        </form>

        <p className="mt-6 text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Log in
          </Link>
        </p>

        <p className="mt-8 text-xs leading-relaxed text-muted-foreground">
          By creating an account you agree to the LeadGen AI Terms and Privacy Policy.
        </p>
      </div>
    </AuthShell>
  );
}
