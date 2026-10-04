# DESIGN.md: La Puerta de Tres Marías, Sucursal Cuernavaca

Experiment-specific plan for one reference-led Astro concept. Not a replacement for shared design canon.

- Brief source: `/Users/g/Downloads/la-puerta-build-prompt-final.md` (handoff 2026-09-20).
- Evidence: `research/business-research-notes.md`, `references/README.md` plus per-site capture folders.
- Skill sources: reference-led-websites SKILL.md and its motion-requirements, animation-patterns, build-decisions and review documents, read from GitHub on 2026-09-20 (no installed copy on this machine). Curator shared library: unavailable, project-local reference research used instead.
- Framework: `@spark-line/web-framework@0.2.1` from npm plus Astro 7. Governed v14.23 context (design_authoring, web_framework) is not reachable from this environment, so per the framework skill the fallback is recorded here and all direction rests on local evidence: repository README, `skills/spark-line-web-framework/SKILL.md` and its three reference files.

## 1. Brief

One independent website concept for the Cuernavaca branch of La Puerta de Tres Marías, for people deciding whether and how to visit. Principal job, from the evidence: make a family-oriented, traditional home-cooking restaurant legible enough to plan a visit around, using only what is verified.

Verified spine (full provenance in the research note):

| Fact | Value | Basis |
|---|---|---|
| Nameplate | La Puerta de Tres Marías, Sucursal Cuernavaca | business video slug plus two aggregators |
| Address | Av. Río Mayo 1490, col. Vista Hermosa, 62290 Cuernavaca | three sources |
| Phone | +52 777 482 3728 | two aggregators agree |
| Positioning | comida mexicana de casa, familiar, with children's play area | business's own captions |
| Google rating | 4.3, about 1.1k reviews | third-party mirrors of Google, 2026-09-20 |
| Hours | 08:00 to 18:00 daily | single source, unconfirmed |
| Current website | not found during research | domain probes plus aggregator fields |

Deliberately absent: prices, menu claims, reservation or WhatsApp channels, garden and live-music features, and any heritage claim belonging to the mountain branch. The site says so in the open rather than filling the gaps with copy.

## 2. Concept

The restaurant publishes no online menu, so a conventional menu section would be invented. The concept turns that absence into the design idea: you get to know this place through what people remember eating there.

Visitor-facing title for that section: "Lo que se recuerda". Each entry is an attributed diner impression, never a menu line.

Three defining outcomes:

- A. Signature hero: a full-bleed clay-and-masa composition where the name is set in oversized display type and physically occluded by a row of clay pots, adapting Burrito Madre's depth device (reference 3) with Rosetta's centered typeset wordmark discipline (reference 1). Motion expresses the idea: the pots settle into place as the light warms, so the opening reads as a kitchen counter receiving its cazuelas rather than a heading appearing over a photo.
- B. Signature interaction: "la fila de cazuelas", a horizontally draggable and keyboard-operable row of clay pots. Selecting a pot opens the attributed memory tied to it and moves the pot forward in the row. This changes how a visitor explores the food: browsing by remembered dish instead of scrolling an invented carta.
- C. Scroll choreography: one continuous progression from the hero counter through the casa, the memory row, and the visit block, so the page reads as arriving, sitting, eating and leaving.

## 3. Tokens

Project-owned, defined after the framework foundation. The package ships no palette; these are semantic project slots.

```css
--project-surface-default: #F6EADA;  /* masa */
--project-surface-clay:    #2E1B12;  /* interior de barro */
--project-surface-terra:   #B4552D;  /* barro cocido */
--project-text-default:    #24170F;
--project-text-inverse:    #F6EADA;
--project-action-background: #B4552D;
--project-action-foreground: #FFF7EC;
--project-accent-flor:     #B4325F;  /* bugambilia de Cuernavaca */
--project-type-display:    clamp(3.2rem, 11vw, 9.5rem);
--project-type-h2:         clamp(2rem, 4.5vw, 3.6rem);
--project-type-body:       clamp(1.125rem, 0.4vw + 1rem, 1.25rem); /* 18px floor */
--project-type-small:      1rem;  /* never below the 16px readable floor */
--project-font-display: "Fraunces", "Iowan Old Style", Georgia, serif;
--project-font-body: "Instrument Sans", "Helvetica Neue", Arial, sans-serif;
```

Type is loaded from Google Fonts with a full local fallback stack, so the concept still renders correctly offline. No em dashes anywhere in visitor-facing copy, metadata or accessibility labels.

## 4. Page structure

Single main page, native scrolling, `noindex` on every route.

1. `Header` (sticky, slim): typeset name, phone action, "cómo llegar" link.
2. `Hero`: clay counter composition, oversized name behind a pot row, one-line positioning, two actions (call, plan the visit). Scroll handoff into section 3.
3. `La casa`: the family positioning in the business's own words, plus the honest note that no official site or menu was found during research.
4. `Lo que se recuerda`: the signature pot row with attributed memories.
5. `Reputación`: the 4.3 rating with platform, observation date and the mirror caveat stated plainly.
6. `Visítanos`: address, phone, single-source hours flagged as unconfirmed, Google Maps link, and an explicit "no confirmed reservation channel" line.
7. `Footer`: the concept disclaimer, research date, and the unverified-channel list.

## 5. Asset plan

No photography of this establishment is licensed for reuse (research note section 7), and generated food or premises imagery may not be presented as documentary evidence. Therefore:

- All hero and section artwork is hand-authored inline SVG (clay pots, masa grain, bougainvillea sprig) plus CSS gradients. Nothing photographic, nothing generated, nothing claiming to show this restaurant.
- Each SVG carries an empty `alt` role and an `aria-hidden` attribute where decorative, and a visible "ilustración, no fotografía del lugar" label where it could be mistaken for a record of the place.
- No image files ship in the concept. This also keeps the concept out of any asset pipeline.

## 6. Reference-to-element mapping

| Element | Source | Adapted | Different | Motion verified? |
|---|---|---|---|---|
| Hero wordmark depth | `references/burrito-madre/` | brand word set oversized and occluded by the subject layer | serif typesetting, daylight clay palette, subject is an illustration not a photograph | No, static capture only |
| Hero centering and restraint | `references/rosetta-cdmx/` | single centered typeset mark, plain text nav, no invented logo | scroll-driven page instead of route-based single screen | No |
| Memory row cards | `references/qissa-leeds/` | category-led exploration with one-line descriptors under an intro paragraph | content is attributed diner memory, not a menu; no dish counts claimed | No |
| Stats band | `references/qissa-leeds/` | large-numeral rating band | carries platform, date and mirror caveat; omits unverifiable counts | No |
| Editorial offset pair | `references/qissa-leeds/` | offset image column with two-tone display headline | accent word in bougainvillea, illustration not photograph | No |

Rejected: Ballena (modal blocked inspection, see `references/README.md`), Tacos My Guey (wrong brand register and locale).

## 7. Motion contracts

Canonical contract per effect. All timing values below are this implementation's own choice, not measured from any reference, because no reference motion was captured on video.

### M1. Hero entrance: "llega la cazuela"

- Purpose and source: express the concept (a counter receiving its pots) rather than decorate a heading. Source: Burrito Madre depth device plus Rosetta centered mark.
- Trigger: page load, once.
- Initial state: clay surface dark and cool, name at `opacity: 0` and `translateY(0.4em)`, five pots below the frame line at `translateY(14vh)` with staggered rotation.
- Intermediate: light warms across the clay surface (gradient position and a warm overlay opacity), pots rise and settle one by one left to right at 90 ms stagger, name fades up through the pot row so the middle pots occlude it.
- Final state: pots resting on the counter line, name split visually behind them, actions and scroll cue visible.
- Moving elements: five pot groups, name block, warm-light overlay. Anchored: clay surface, counter line, header.
- Sequencing: light starts at 0 ms, pots 120 to 560 ms, name 320 to 1000 ms, actions 900 ms.
- Interruption, reversal, revisit: not reversible, plays once. If the user scrolls during the entrance, the sequence completes rather than cancelling, and no element depends on it to remain legible. Revisiting via back navigation replays it.
- Timing and easing: 1000 ms total, `cubic-bezier(0.22, 1, 0.36, 1)`.
- Assets and renderer: inline SVG plus CSS transforms and opacity. No canvas, no WebGL, no library.
- Mobile: at 390 px the pot row reduces to three pots, the name drops to two lines, and vertical travel halves so the sequence stays inside the first viewport.
- Reduced motion: pots, name and light render in their settled state with no transform or fade. Content and both actions are fully usable.
- Keyboard and touch: no interaction required; nothing is gated on completion.
- Acceptance: with motion on, a capture at 0 ms and at 1200 ms differ in pot position and light; with `prefers-reduced-motion: reduce` the 0 ms capture already matches the settled state; the name is readable at every frame; no horizontal overflow at 390 px.

### M2. Scroll handoff from hero to casa

- Purpose and source: connect the hero to the content below, per the scroll requirement. Source: Qissa's continuous narrative progression.
- Trigger: native scroll, first viewport height of progress.
- Initial state: pots at rest, `La casa` heading below the fold.
- Intermediate: pot row translates up at 0.35 scroll progress factor and fades to 0.55, the counter line thickens, and the clay surface light continues warming.
- Final state: hero fully scrolled away, casa section at natural position with its reveal complete.
- Moving: pot row, counter line, warm overlay. Anchored: header, section flow.
- Sequencing: single continuous mapping, no discrete steps.
- Timing: driven by scroll position, not duration. Easing not applicable.
- Renderer: CSS `animation-timeline: view()` where supported. Browsers without scroll-driven animations (and `prefers-reduced-motion: reduce`) render the settled state statically; no IntersectionObserver transform fallback, since a JS-driven scroll mapping would duplicate what the native timeline does and add a second motion path to keep in sync. Native scrolling only, no pinning, no scroll jacking.
- Mobile: same mapping with reduced travel.
- Reduced motion: mapping disabled, sections appear statically.
- Keyboard and touch: standard scrolling, no hijack, anchor links still jump correctly.
- Acceptance: two captures at 25 percent and 70 percent hero scroll progress show different pot offsets, and the browser's own scroll position changes normally with keyboard arrows and space.

### M3. Signature interaction: la fila de cazuelas

- Purpose and source: change how food information is explored, from scrolling a carta to selecting a remembered dish. Source: Qissa category band plus Burrito Madre occlusion.
- Trigger: pointer click, drag, keyboard arrow or Enter on a pot, plus horizontal scroll.
- Initial state: five pots in a row, first selected, its memory panel open below.
- Intermediate: selected pot scales to 1.08 and lifts 10 px, unselected pots drop to 0.86 opacity and settle back, the memory panel crossfades and slides 12 px from the direction of travel, and the pot's clay glaze accent shifts to bougainvillea.
- Final state: newly selected pot holds the raised state, its attributed memory is fully visible and focusable.
- Moving: pot group transform and opacity, memory panel content. Anchored: section heading, intro copy, row baseline.
- Sequencing: pot response starts immediately, panel swap begins at 60 ms so the two read as cause and effect.
- Interruption, reversal, revisit: rapid repeated selection interrupts the previous panel transition with no queueing, reversal mirrors direction, and a previously seen pot reopens the same content with no entrance replay of the whole section.
- Timing and easing: pot 220 ms, panel 260 ms, both `cubic-bezier(0.2, 0, 0, 1)`.
- Assets and renderer: inline SVG pots, one small vanilla script island scoped to the section, `aria-selected` state on real buttons, `scroll-snap` on the row. No framework runtime added for this.
- Mobile: row becomes horizontally swipeable with 32 px peek of the next pot, panel sits directly under the row, tap targets at least 44 px.
- Reduced motion: pot scale and panel slide are removed, selection state and content swap remain instant and visible.
- Keyboard and touch: row is a tab stop, left and right arrows move selection, Home and End jump to first and last, focus ring is visible at all times, Escape returns focus to the selected pot.
- Acceptance: selecting pot three changes both the raised pot and the panel text in the rendered build, arrow keys do the same without a pointer, the swap works with reduced motion on, and no dish appears without its attribution line and platform date.

### M4. Section reveals in casa, reputation and visit

- Purpose and source: staged progression through the lower page. Source: Qissa editorial sections.
- Trigger: element enters the viewport at 15 percent visibility, once per element.
- Initial state: `opacity: 0`, `translateY(18px)`.
- Final state: `opacity: 1`, `translateY(0)`.
- Sequencing: children stagger at 70 ms inside a section.
- Timing and easing: 480 ms, `cubic-bezier(0.22, 1, 0.36, 1)`.
- Moving: reveal targets. Anchored: section containers and spacing, so no layout shifts.
- Interruption and revisit: plays once, later revisits render settled.
- Mobile: identical.
- Reduced motion: no transform or fade, content is present in the DOM from first paint and visible.
- Acceptance: with JavaScript disabled entirely, every section's text is still visible, so the reveal is enhancement only.

## 8. Technical decisions

- Astro static output, one page route plus a presentation wrapper route.
- Framework primitives carry structure: `PageFlow`, `Section`, `SectionGroup`, `Container`, `Stack`, `Cluster`, `Grid`, `Heading`, `Text`, `Action`, `VisualFrame`. Project CSS owns all identity.
- Signature interaction is a small vanilla script, not a React island, because the state is local DOM selection and adding React would ship hydration for no benefit.
- Concept lives in `lab/concepts/la-puerta-de-tres-marias/` with its own `package.json`, private and unpublishable. Verified at handoff that the root `files` allowlist ships only `dist/`, `src/astro/`, `styles/`, `starter/`, `skills/`, `README.md` and `LICENSE`, so `lab/` cannot enter a tarball.
- No registry entries, no catalog manifest, no gallery route changes, no export changes. Candidates stay documented only.

## 9. Unresolved evidence

- Google rating and review count rest on third-party mirrors; the live listing was not readable. Counts disagree (1,073 to 1,181).
- Hours are single-source and unconfirmed. WhatsApp is inferred from the same source. Reservation channel contradicts itself. Delivery status contradicts itself.
- No business-controlled confirmation of garden, terrace or live music for this branch.
- No reference motion was captured continuously, so every timing in section 7 is our own choice and no claim here describes how any reference site actually animates.
- Whether this branch is currently open was not directly confirmed for 2026.
