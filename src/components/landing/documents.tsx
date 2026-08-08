import documentsFounder from "@/assets/documents-founder.jpg";
import { Annotation, SectionLabel } from "@/components/leadgen/marks";
import { ProductFrame, UploadPanel } from "@/components/leadgen/product";
import { Reveal } from "@/components/leadgen/reveal";

export function Documents() {
  return (
    <section id="documents" className="mx-auto max-w-6xl px-5 py-20 sm:px-8 lg:py-28">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-center lg:gap-14">
        <Reveal variant="polygon">
          <figure>
            <img
              src={documentsFounder}
              alt="A founder comparing a printed product catalogue against her laptop"
              width={1280}
              height={960}
              loading="lazy"
              className="w-full rounded-lg border border-border object-cover"
              style={{ clipPath: "polygon(0 3%, 100% 0, 97% 100%, 3% 96%)" }}
            />
            <figcaption className="mt-3 text-[12.5px] text-muted-foreground">
              Most of the context you need is already written down somewhere.
            </figcaption>
          </figure>
        </Reveal>

        <div>
          <Reveal>
            <SectionLabel>Documents</SectionLabel>
            <h2 className="mt-4 text-[2rem] leading-tight font-semibold sm:text-[2.5rem]">
              Bring the deck you already wrote.
            </h2>
            <p className="mt-5 max-w-md text-[16px] leading-relaxed text-muted-foreground">
              Add your website and attach a PDF — a catalogue, a one-pager, a pitch deck.
              LeadGen reads the detail from there so you don't retype your own business.
            </p>
            <Annotation className="mt-4 block">
              "Your docs already know a lot."
            </Annotation>
          </Reveal>

          <Reveal variant="scale" delay={120} className="mt-7">
            <ProductFrame title="Documents & website">
              <UploadPanel />
            </ProductFrame>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
