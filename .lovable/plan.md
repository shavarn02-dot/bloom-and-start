# LeadGen AI — Motion & Micro-interactions Upgrade

Make the whole experience feel more alive and premium without breaking the calm editorial tone. Focus is on purposeful motion: entrances that guide reading, hover states that reward exploration, and loading/transition moments that feel considered rather than abrupt.

## 1. Hero refinement

Fix the remaining mobile spacing issue and add staged, cinematic entrance motion.

- Fix the empty vertical gap below the headline on mobile by making the portrait container collapse gracefully when hidden, and ensure the first portrait appears immediately instead of waiting for the desktop reveal delay.
- Stagger the hero copy entrance: eyebrow → headline → underline draw → subcopy → CTA pair → trust line, with a total sequence of ~900ms.
- Add a subtle parallax drift to the editorial polygon background on scroll (CSS-only, transform on a separate compositor layer).
- Improve portrait transitions: outgoing image should feel like it steps back (scale 0.97 + slight blur), incoming image steps forward (scale 1.02 settling to 1). Keep the 760ms cinematic ease.
- Add a soft, shifting drop-shadow beneath the active portrait so the cutout feels grounded on the polygon plate.
- Animate the handwritten thought with a tiny sketch arrow that draws itself on each portrait change.

## 2. Landing page motion system

Upgrade section reveals and interactive moments so the long scroll feels rhythmic, not repetitive.

- Replace the uniform `Reveal` fade-up on every section with a varied entrance vocabulary:
  - Problem: old-way items slide in from alternating x-offsets; new-way connector draws downward.
  - How it works: image panels wipe in from the direction they face; text blocks fade up.
  - Product demo: tab content crossfades with a scale settle; active tab gets an animated sliding background pill.
  - Pricing: card scales in; feature checkmarks pop in one by one; CTA arrow nudges on hover.
  - FAQ: questions fade in with a slight y-offset; accordion uses a smoother height+opacity curve.
  - Final CTA: founder image and background shape reveal with a polygon wipe; headline words stagger in.
- Add hover micro-interactions:
  - Primary CTA buttons: arrow slides right on hover, button lifts slightly with `shadow-lift`.
  - ProductFrame cards: subtle y-shift and shadow increase on hover.
  - Footer links: underline grows from left on hover.
  - Trust strip facts: fade through a subtle opacity pulse on first view.
- Animate the sketch system so connectors and glyphs feel hand-drawn in real time, not just revealed.
- Add a scroll-linked progress indicator (thin line under the header) that fills as the user moves down the landing page.

## 3. Dashboard motion & micro-interactions

Make the workspace feel responsive and polished.

- Sidebar:
  - Active item gets an animated indicator pill that slides to the new selection.
  - Hover states transition background and text color smoothly.
  - User card and logout button lift slightly on hover.
- Route transitions:
  - Add a soft fade/slide when navigating between `/app/*` routes so pages don't snap in.
- Loading states:
  - Replace plain spinner text with skeleton screens for campaigns, leads, profiles, and documents.
  - Tables show shimmering row placeholders while data loads.
- Tables:
  - Rows have a subtle hover lift and background transition.
  - Sorting reorders with a brief transition instead of an instant snap.
  - Empty states animate the sketch drawing when first shown.
- Campaign creation:
  - Stepper numbers animate between states (todo → active → done with a check pop).
  - Progress bar uses a smoother width transition and a subtle shimmer while running.
  - Success state scales in the checkmark and reveals the "View leads" button.
- Forms:
  - Inputs animate border color and a soft glow on focus.
  - Save buttons show a checkmark morph after submission instead of just text swap.
- Cards/panels:
  - Interactive panels lift and deepen shadow on hover.
  - Usage bars animate width on first view.

## 4. Global polish

- Add a consistent focus-visible ring animation (scale + ring draw) for keyboard users.
- Ensure every new animation respects `prefers-reduced-motion` by falling back to instant or opacity-only transitions.
- Keep all motion CSS-driven; no new animation libraries unless a complex sequence genuinely needs them.
- Audit and remove any layout-shift-causing animations (e.g. height auto transitions).

## Technical notes

- All new keyframes live in `src/styles.css` as `@utility` or `@keyframes` so they are reusable and respect reduced motion in one place.
- Reusable motion primitives go in `src/components/leadgen/reveal.tsx` or new `src/components/leadgen/motion.tsx` (stagger container, animated underline, sliding tab indicator).
- Dashboard skeletons live in `src/components/dashboard/skeletons.tsx` and replace inline spinner blocks.
- No changes to business logic, data fetching, or routing; this is a presentation-layer pass only.
- Verify on desktop, tablet, and mobile viewports, and confirm no horizontal overflow returns after adding transforms.
