# Reference selection notes

- Date: 2026-09-20. Method: standalone Playwright headless captures at 1440x900 and 390x844, sampled scroll states 0/30/60/90 percent, saved in the sibling folders of this file.
- Curator library: unavailable (not installed on this machine, verified at handoff). Project-local research used instead, per brief.
- Evidence limitation, applies to every entry: static screenshots establish composition and state differences only. None of the observed sites had their animation timing, easing, or smoothness verified with continuous recording. Where this note says "motion," it is inference from DOM/visual state or documented reputation, and is labeled as such.

## Selected

### 1. Rosetta (CDMX) - composition/type ANCHOR
- URL: https://rosetta.com.mx/ (captured 2026-09-20; folder `rosetta-cdmx/`)
- Section: full homepage viewport (single screen, scrollHeight equals viewport; navigation is route-based).
- Observed: split-screen hero of two real dish photographs (green plate / terracotta plate) meeting at the vertical center line; typeset serif wordmark "ROSETTA" dead center straddling both images; plain text nav list upper left; ESP/ENG upper right; award marks lower right; cookie notice bottom center. Mobile (390px): the two images stack vertically with the wordmark centered between them; hamburger replaces the nav list.
- Why it fits La Puerta: a Mexican restaurant whose identity is carried by editorial restraint (real photography, serif typesetting, no invented logo, bilingual audience) matches a family cantina-style kitchen we must present without clichés. The center-wordmark-over-two-surfaces structure adapts directly to a two-halves composition (morning light / clay pot).
- Intentionally different: Rosetta is fine-dining dark and still; La Puerta is daylight, warm terracotta, and scroll-driven (Rosetta has no scroll narrative to borrow). Rosetta's nav is routes; ours is one page.
- Motion: not verified (single-viewport page; entrance behavior could not be observed through instant scroll sampling).

### 2. Qissa, "A Tale of Food" (Sevenoaks, UK) - scroll narrative + menu exploration SUPPORT
- URL: https://www.qissa.co.uk/ (Awwwards entry https://www.awwwards.com/sites/qissa-a-tale-of-food; captured 2026-09-20; folder `qissa-leeds/`)
- Sections: hero (scroll00), menu category band (scroll30), stats band + editorial pair (scroll60).
- Observed: full-bleed warm night photograph with centered serif display wordmark and gold pill CTAs; "BEGIN THE STORY" scroll prompt with a vertical hairline. Below: six menu category cards (photo + serif title + one-line description) under an intro paragraph; then a stats band (4.8 star Google rating, 407 reviews, 99+ dishes, infinity "stories told") in large gold numerals; then editorial sections pairing an offset photo column with a two-tone serif headline ("Beneath the blossoms." with the accent word in gold). Page is long (11.7k px) with a starfield ambient background between sections.
- Why it fits: it is the clearest inspected model of (a) a scroll progression that tells the visit as a story, (b) an honest stats band anchored on a Google rating, and (c) category-led menu exploration with one-line descriptors. All three map onto La Puerta's priorities (appeal, food information, visit planning).
- Intentionally different: Qissa is dark navy/gold night dining; La Puerta is morning daylight and clay. Qissa's "99+ dishes" claim would be unverifiable for us, so our stats band carries only what research supports.
- Motion: the scroll progression implies scroll-triggered reveals, but timing/easing was not verified; treat as composition evidence only.

### 3. Burrito Madre (Serbia) - hero typography device SUPPORT
- URL: https://burritomadre.rs/en/ (Awwwards entry https://www.awwwards.com/sites/burrito-madre; captured 2026-09-20; folder `burrito-madre/`)
- Section: hero.
- Observed: three giant tacos photographed on a cream table against deep maroon; the word "TACOS" set in oversized translucent white capitals sits *inside* the food layer, partially occluded by the taco shells, so type and subject share depth. Cream + maroon palette, playful brand mark centered in the header.
- Why it fits: the depth trick (brand word woven behind/into the subject) is the signature hero device we adapt: "LA PUERTA" set oversized and occluded by a clay-pot silhouette, expressing the establishment (the door, the house kitchen) without a literal door gag.
- Intentionally different: Burrito Madre is fast-casual pop; we keep the device but execute it with serif typesetting and a daylight palette, and it must survive as a static composition too.
- Motion: whether the word animates on load was not verified.

## Rejected

### Ballena (Cabo) - folder `ballena-cabo/`
- Awwwards entry https://www.awwwards.com/sites/ballena-fine-dining, live https://ballenacabo.com/.
- Rejected 2026-09-20: an events modal covered the hero on first load in headless capture, and the underlying composition (macro plate photo with whale-shadow motif) could not be inspected cleanly. Its non-literal brand-metaphor lesson is already covered by other selections. Kept as evidence of the rejection, not used as a source.

### Tacos My Guey (Orlando)
- Awwwards entry https://www.awwwards.com/sites/tmg-mexican-restaurant, live https://tacosmyguey.com.
- Rejected 2026-09-20: US taqueria chain; a location-detector modal blocked the page and the brand register (cheeky American-Mexican) does not fit a Morelos family restaurant. Capture folder deleted after the decision.
