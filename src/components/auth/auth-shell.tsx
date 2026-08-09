import { useEffect, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import islandOne from "@/assets/island-scene-01.jpg";
import islandTwo from "@/assets/island-scene-02.jpg";
import { Wordmark } from "@/components/leadgen/wordmark";
import { Annotation, HandArrow } from "@/components/leadgen/marks";

const SCENES = [
  {
    src: islandOne,
    alt: "A founder working on a laptop at a wooden deck overlooking a tropical island bay",
  },
  {
    src: islandTwo,
    alt: "A second founder joining the same island deck while the first keeps working on his laptop",
  },
];

/**
 * Cinematic open-world island scene: one continuous environment that fills the
 * whole left panel. The camera stays put — only the people change as the
 * second founder enters the same world.
 */
function IslandWorld() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    const id = window.setInterval(() => setIndex((i) => (i + 1) % SCENES.length), 4200);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="absolute inset-0 -z-10 overflow-hidden" aria-hidden={false}>
      {SCENES.map((scene, i) => {
        const active = i === index;
        return (
          <img
            key={scene.src}
            src={scene.src}
            alt={i === 0 ? scene.alt : ""}
            width={1024}
            height={1536}
            {...(i === 0 ? {} : { "aria-hidden": true })}
            className="absolute inset-0 size-full object-cover object-[58%_50%] transition-[opacity,transform] duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
            style={{
              opacity: active ? 1 : 0,
              transform: active ? "scale(1.02) translateY(0)" : "scale(1.06) translateY(-1.2%)",
            }}
          />
        );
      })}

      {/* environment blends into the warm paper background — no card, no frame */}
      <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-foreground/10 to-foreground/25" />
      <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background to-transparent lg:w-32" />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background/70 to-transparent lg:hidden" />
    </div>
  );
}

/**
 * Split authentication shell: an immersive island world on the left,
 * a calm conversion-focused form on the right.
 */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[46fr_54fr]">
      {/* LEFT — the world */}
      <aside className="relative isolate min-h-[42vh] overflow-hidden lg:min-h-screen">
        <IslandWorld />

        <div className="relative flex h-full min-h-[42vh] flex-col justify-between gap-10 px-6 py-8 sm:px-10 lg:px-14 lg:py-12">
          <Link to="/" className="hidden w-fit lg:block" aria-label="LeadGen AI home">
            <Wordmark className="text-paper [&_span]:text-paper/70" />
          </Link>

          <div className="max-w-xs">
            <p className="text-2xl font-semibold tracking-tight text-paper drop-shadow-sm sm:text-[28px]">
              Work from anywhere.
            </p>
            <span className="mt-2 flex items-end gap-2">
              <Annotation className="text-xl text-paper/85">
                Find the right people everywhere.
              </Annotation>
              <HandArrow animated className="h-5 w-11 text-paper/70" />
            </span>
          </div>
        </div>
      </aside>

      {/* RIGHT — form panel */}
      <main className="flex flex-col justify-center px-6 py-12 sm:px-10 lg:px-16">
        <div className="mx-auto w-full max-w-[500px]">
          <Link to="/" className="mb-8 block w-fit lg:hidden" aria-label="LeadFlowX home">
            <Wordmark />
          </Link>
          {children}
        </div>
      </main>
    </div>
  );
}
