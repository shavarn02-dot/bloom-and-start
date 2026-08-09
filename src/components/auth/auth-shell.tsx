import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import authFounder from "@/assets/auth-founder.jpg";
import { Wordmark } from "@/components/leadgen/wordmark";
import { Annotation, HandArrow } from "@/components/leadgen/marks";
import { SketchSearch, SketchConnector } from "@/components/leadgen/sketches";
import { Reveal } from "@/components/leadgen/reveal";

/**
 * Split authentication shell: editorial photography on the left,
 * a calm conversion-focused form on the right.
 */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[46fr_54fr]">
      {/* LEFT — brand / visual panel */}
      <aside className="relative isolate overflow-hidden bg-cream">
        <div
          className="absolute inset-0 -z-10 bg-primary-soft/40"
          style={{ clipPath: "polygon(0 0, 100% 0, 100% 82%, 0 96%)" }}
          aria-hidden="true"
        />

        <div className="flex h-full flex-col justify-between gap-8 px-6 py-8 sm:px-10 lg:px-14 lg:py-12">
          <Link to="/" className="hidden w-fit lg:block" aria-label="LeadGen AI home">
            <Wordmark />
          </Link>

          <div className="relative">
            <Reveal variant="polygon">
              <div
                className="relative overflow-hidden shadow-lift"
                style={{
                  clipPath:
                    "polygon(4% 2%, 100% 0, 96% 94%, 0 100%)",
                }}
              >
                <img
                  src={authFounder}
                  alt="A founder researching potential customers on a laptop"
                  width={1024}
                  height={1536}
                  className="h-[220px] w-full object-cover object-[60%_30%] sm:h-[300px] lg:h-[460px]"
                />
              </div>
            </Reveal>

            <Reveal
              variant="fade"
              delay={320}
              className="pointer-events-none absolute -top-3 right-2 hidden items-end gap-1 lg:flex"
            >
              <Annotation className="text-xl text-foreground/70">
                Find the right people.
              </Annotation>
              <HandArrow animated className="h-6 w-14 -rotate-6" />
            </Reveal>

            <SketchSearch className="absolute -left-3 bottom-6 hidden h-12 w-12 text-primary/50 lg:block" />
          </div>

          <div className="max-w-sm">
            <p className="font-hand text-2xl text-primary">More conversations.</p>
            <p className="mt-1 text-lg leading-snug text-foreground">
              Less searching. Describe your business once — LeadGen AI keeps the
              research going for you.
            </p>
            <SketchConnector className="mt-5 hidden h-8 w-40 text-border-strong lg:block" />
          </div>
        </div>
      </aside>

      {/* RIGHT — form panel */}
      <main className="flex flex-col justify-center px-6 py-12 sm:px-10 lg:px-16">
        <div className="mx-auto w-full max-w-[420px]">
          <Link to="/" className="mb-8 block w-fit lg:hidden" aria-label="LeadGen AI home">
            <Wordmark />
          </Link>
          {children}
        </div>
      </main>
    </div>
  );
}
