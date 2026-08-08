import securityDesk from "@/assets/security-desk.jpg";
import { SectionLabel } from "@/components/leadgen/marks";

const facts = [
  {
    title: "Your data stays yours",
    copy: "Business profiles and uploaded documents are used to run your campaigns, not shared with other accounts.",
  },
  {
    title: "Row-level access control",
    copy: "Every record is scoped to the account that created it.",
  },
  {
    title: "Server-side API secrets",
    copy: "Provider keys live on the server and are never exposed to the browser.",
  },
  {
    title: "Public sources only",
    copy: "Discovery works from publicly available company and contact information.",
  },
];

export function Security() {
  return (
    <section id="security" className="mx-auto max-w-6xl px-5 py-20 sm:px-8 lg:py-28">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-14">
        <div>
          <SectionLabel>Data handling</SectionLabel>
          <h2 className="mt-4 text-[2rem] leading-tight font-semibold sm:text-[2.5rem]">
            What we do with your information.
          </h2>
          <p className="mt-5 max-w-lg text-[16px] leading-relaxed text-muted-foreground">
            Plainly stated, with no claims we haven't earned. If a certification isn't
            listed here, we don't have it yet.
          </p>

          <dl className="mt-8 grid gap-6 sm:grid-cols-2">
            {facts.map((f) => (
              <div key={f.title}>
                <dt className="text-[14.5px] font-semibold text-foreground">{f.title}</dt>
                <dd className="mt-1.5 text-[13.5px] leading-relaxed text-muted-foreground">
                  {f.copy}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <figure className="self-end">
          <img
            src={securityDesk}
            alt="A founder working at a laptop at a desk"
            width={1280}
            height={960}
            loading="lazy"
            className="w-full rounded-lg border border-border object-cover"
            style={{ clipPath: "polygon(0 4%, 100% 0, 96% 100%, 2% 94%)" }}
          />
          <figcaption className="mt-3 text-[12.5px] text-muted-foreground">
            Campaigns run in the background — you don't have to sit and watch them.
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
