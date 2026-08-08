# LeadGen AI — Landing Page + Dashboard UI Shell

Build the marketing site and the product dashboard as front-end UI, following the DRD's design language: warm editorial paper-white palette, one restrained green accent, refined sans-serif with handwritten accents, and the signature shaded-underline system.

## Design system

- Warm off-white/paper background, cream and soft grey surfaces, charcoal text, one muted green accent, soft warm yellow for handwritten highlights. All tokens in `src/styles.css` — no hardcoded colors in components.
- Type: refined sans (Inter/Manrope direction) for everything; a handwritten face used only for eyebrows, annotations and arrows.
- Signature underline: a reusable component that draws a slightly irregular hand-shaded highlight behind a phrase.
- Motion: subtle, 150–250ms; no glows, blobs, particles, or heavy glassmorphism.

## Landing page (`/`)

Sections in order, per DRD:

1. Header — wordmark, nav (Product, How it works, Pricing, Resources), Log in + "Start finding leads →". Transparent at top, warm-white + blur + thin border on scroll.
2. Hero — handwritten eyebrow, headline with shaded underline on "business should be talking to", supporting copy, dual CTA, trust line. Asymmetric polygon-masked composition: background-removed founder cutout integrated with a live product-UI layer that loops through profile → search → strategy → verification → scoring, plus a handwritten "Let's find them →" annotation. Mobile reorders to headline → CTA → cutout → product UI.
3. Trust strip — factual statements only (No credit card, Free to start, Multi-provider AI, CSV export).
4. Problem — "Finding leads shouldn't feel like a second job." with a hand-drawn style illustration.
5. How it works — 01/02/03 with real product UI.
6. Interactive product demonstration — tabbed/stepped walkthrough of actual UI (business profile form, campaign progress, lead table).
7. Lead quality — lead table with Name, Company, Role, Location, Match, Status.
8. Business context section — fields list with "Start with what you already know." annotation.
9. AI workflow — editorial system diagram, no photography, no neural-net graphics.
10. Security — factual claims only (no SOC 2 / enterprise-grade / uptime claims), with a secondary side-on founder-at-laptop photo.
11. Pricing — single clean Free plan with the DRD's limits and CTA.
12. Trust — "We'd rather show you the product." with the handwritten note.
13. FAQ — the seven DRD questions.
14. Final CTA — "Your next customer is already out there."
15. Footer.

## Dashboard UI shell

Routes under a `/app` sidebar layout (LeadGen AI wordmark, Overview, Campaigns, Leads, Business Profiles, Documents, Settings, user block at bottom):

- Overview — greeting, "What are we looking for today?", + New Campaign, recent campaigns.
- Campaigns — list plus the 4-step creation form (select profile → review audience → confirm → generate) and the polished progress screen with checklist + percentage.
- Leads — search/filter/sort/Export CSV, table, and a clean lead detail drawer using only the DRD's fields.
- Business Profiles, Documents, Settings — forms and lists.
- Full empty-state system with subtle illustrations and handwritten annotations, using the DRD's exact copy.

No login is wired up in this pass; the dashboard is reachable directly and all data is static.

## Data honesty

No testimonials, customer logos, user counts, revenue figures, reviews, or urgency devices anywhere. Every table, chart, and progress screen that shows rows carries a visible "Example data" label.

## Hero imagery

Generate a photorealistic portrait of an Indian woman founder (25–35, smart casual, natural expression, realistic skin/hair texture) and cut the background out into a transparent PNG for the polygon-masked hero composition. Same approach for the secondary side-on laptop shot in the security section. Note: these are AI-generated and should be swapped for licensed real photography before launch, as the DRD requires.

## Technical notes

- TanStack Start file routes: `index.tsx` for the landing page, `app.tsx` layout + child routes for the dashboard. Each route gets its own `head()` metadata.
- Shared components in `src/components/` (landing sections, dashboard shell, `HandUnderline`, `Annotation`, `ExampleDataBadge`, lead table, empty states).
- Fonts loaded via `<link>` in `__root.tsx`. Motion via CSS transitions/keyframes.
- Static example data lives in a single `src/data/example.ts` module so it is obvious what is not real.
