import { Link } from "@tanstack/react-router";
import founder from "@/assets/founder-cutout.png";
import { Annotation, HandUnderline } from "@/components/leadgen/marks";

export function FinalCta() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto grid max-w-6xl items-end gap-8 px-5 pt-20 sm:px-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:pt-28">
        <div className="pb-20 lg:pb-28">
          <h2 className="max-w-xl text-[2.2rem] leading-[1.1] font-semibold sm:text-[2.9rem]">
            Your next customer is <HandUnderline>already out there</HandUnderline>.
          </h2>
          <p className="mt-5 text-[17px] text-secondary-foreground">
            You just need a better way to find them.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              to="/app"
              className="inline-flex h-11 items-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors duration-200 hover:bg-primary/90"
            >
              Start finding leads&nbsp;→
            </Link>
            <span className="text-[13px] text-muted-foreground">
              No credit card required · Free to start
            </span>
          </div>
          <Annotation className="mt-6 block">See you inside →</Annotation>
        </div>

        <div className="relative hidden lg:block">
          <div
            aria-hidden="true"
            className="absolute inset-x-6 bottom-0 top-8 bg-cream"
            style={{ clipPath: "polygon(10% 0, 100% 8%, 90% 100%, 0 100%)" }}
          />
          <img
            src={founder}
            alt=""
            width={912}
            height={1200}
            loading="lazy"
            className="relative mx-auto w-[76%] object-contain"
            style={{ clipPath: "polygon(4% 0, 100% 4%, 96% 100%, 0 100%)" }}
          />
        </div>
      </div>
    </section>
  );
}
