import { SectionLabel } from "@/components/leadgen/marks";
import { Reveal } from "@/components/leadgen/reveal";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "Is LeadFlowX really free?",
    a: "Yes. The current plan is free and includes up to 3 business profiles, up to 50 leads per campaign and up to 10 campaigns per month. There is no paid tier at the moment.",
  },
  {
    q: "Do I need a credit card?",
    a: "No. You can create an account and run campaigns without entering any payment details.",
  },
  {
    q: "How many leads can I generate?",
    a: "Each campaign returns up to 50 leads. With 10 campaigns a month, that is the current ceiling.",
  },
  {
    q: "How many campaigns can I create?",
    a: "Up to 10 campaigns per month on the free plan.",
  },
  {
    q: "Can I export leads?",
    a: "Yes. Any lead list can be exported to CSV from the leads screen.",
  },
  {
    q: "Can I upload my company's documents?",
    a: "Yes. You can attach PDFs — a deck, a catalogue, a one-pager — and LeadFlowX reads them as extra business context when building your search strategy.",
  },
  {
    q: "What happens when an AI provider reaches its limit?",
    a: "Work is routed across several providers. If one hits a rate limit or is unavailable, the next provider picks the job up so your campaign keeps running.",
  },
];

export function Faq() {
  return (
    <section id="faq" className="bg-paper">
      <div className="mx-auto max-w-3xl px-5 py-20 sm:px-8 lg:py-28">
        <Reveal className="max-w-2xl">
          <SectionLabel>Questions</SectionLabel>
          <h2 className="mt-4 text-[2rem] leading-tight font-semibold sm:text-[2.4rem]">
            The things people ask first.
          </h2>
        </Reveal>

        <Accordion type="single" collapsible className="mt-8">
          {faqs.map((faq, i) => (
            <Reveal key={faq.q} delay={i * 60}>
              <AccordionItem value={faq.q}>
                <AccordionTrigger className="text-left text-[15.5px] font-medium transition-colors hover:text-foreground [&[data-state=open]>svg]:rotate-180">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="lg-accordion-content text-[14.5px] leading-relaxed text-muted-foreground">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            </Reveal>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
