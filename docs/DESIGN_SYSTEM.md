# IncomeFlow design system

Original identity: **the allocation rail**. One incoming balance branches into three purposeful destination lines. The mark is a compact set of branching ledger rails, with no shield, coin, hexagon or arrow. Use one icon consistently across favicon, header, social preview and video.

## Direction and reference research

References accessed Nov 25, 2026: [Framer Marketplace](https://www.framer.com/marketplace/templates/) and [fintech category](https://www.framer.com/marketplace/templates/categories/fintech/) (public free listings including Finn; study generous gutters, headline measure and restrained product framing; no template assets copied), [21st.dev](https://21st.dev/) (compact interactions and clear component states), [shadcn dashboard](https://ui.shadcn.com/examples/dashboard) (scanable data hierarchy and consistent controls), [beUI](https://beui.dev/) (timeline and collapsible technical detail), [60fps](https://60fps.design/) (Revolut pockets and task feedback), [React Bits Count Up](https://reactbits.dev/text-animations/count-up) and [Magic UI beam](https://magicui.design/docs/components/animated-beam) (reviewed; not imported because moving amounts/beams could imply unobserved confirmations).

Shared reference guide read: `~/hackathon-creative-studio/references/framer-marketplace.md`. No paid assets or restricted template code used. Initial UI UX Pro Max design-system search suggested glassmorphism and handwritten fonts: rejected as inconsistent with the supplied brief; focused hierarchy guidance retained.

Three directions considered: a dense accountant ledger, a dark control room, and a light allocation workbench. Chosen: the light workbench for a daytime working professional, with a dark ink receipt surface for inspectable evidence. No decorative metrics or invented customer proof.

## Tokens

Three layers: raw palette/spacing -> semantic surfaces/text/state -> button/input/panel roles. All CSS colors and families live in root/theme tokens. Ground `#f5f7f6`, paper `#ffffff`, ink `#172b27`, subdued `#52645e`, border `#dce4df`, action pine `#165d4c`. Allocation colors: pine, slate blue and ochre, always paired with category text and exact percentages. Error `#a33127`, warning `#785314`. A dark theme maps the same semantic roles to dark surfaces with light readable text.

Type: locally hosted Manrope, SIL Open Font License, static weights 400, 600 and 800. One family in operating screens; wordmark uses a deliberate 800 weight. Numeric data uses tabular figures. Marketing headline at most 80px; product headings 28–36px; body 15–17px; compact labels 13–14px. No tracked capitals or decorative eyebrow labels.

Spacing: 4/8/12/16/24/32/48/64px, capped 1200px content, generous task boundaries, 12–16px panel radius, consistent 44px controls, visible 2px focus outline. Product navigation is a top row for five destinations. Phone layouts stack forms and allocation rows; tables become readable receipts. No horizontal page overflow.

## Components and motion

Logo/wordmark, wallet control, top navigation, allocation rail, semantic status label, recipient editor, receipt timeline, address-copy control, health definition list and progressively disclosed advanced details. All visible controls work or explain why disabled. Forms preserve inputs and surface errors near their action. Destructive recovery requires an inline acknowledgement.

Micro transitions: 160–220ms on color/opacity/transform only. The allocation preview responds to actual inputs; lifecycle states change only with verified chain evidence. No automatic count-up on balances, no artificial transaction delay. Respect prefers-reduced-motion with immediate transitions. All content visible without animation.

## Brand assets

SVG is the source of truth. Header icon 32px, favicon 32px, clear space at least one rail width. Light and dark exports use pine/light ink; no distortion, rotation or decorative gradient. PNG/app/social exports are generated from these vector sources with browser rendering. No trademark clearance is claimed.

## QA ledger

Production browser QA completed 10/10 tests before review fixes. Desktop, tablet, 390px and 320px captures were inspected. Independent Impeccable design and technical assessments identified draft preservation, inline validation, narrow navigation, small supporting text and touch targets; fixes are implemented and final recapture is pending. Hallmark static recheck reports 0 FAIL, 0 REFLEX, 0 WARN and two documented false-positive label dismissals. Its Puppeteer render tier is unavailable; actual rendering is inspected through Playwright instead. Final findings and results belong in TESTING.md.

## Applied studio guidance

Discovered and used: Premium UI Design, Hallmark, Impeccable, UI UX Pro Max, Brand Identity Studio, Design System, Frontend Motion Design and Frontend Visual QA. Video work used Hackathon Video Studio and installed Remotion guidance with the shared video workspace. The existing branching identity was preserved. Hallmark static checks passed with two documented dismissals; its unavailable Puppeteer renderer was not claimed as passed. Actual production captures were inspected through the independent Playwright/CI workflow.

## Payment Passport extension

Preserve the allocation-rail mark, Manrope, pine/slate/ochre semantic palette and light/dark tokens. The owner surface uses a request index beside a signed financial document; the client surface uses one readable payment document. The amount and verified outstanding balance carry hierarchy, while full addresses and signatures sit in readable/wrapping detail rows. Status text communicates signature, transfer and allocation separately; no status animation substitutes for chain evidence.

Reference review: [Framer Marketplace](https://www.framer.com/marketplace/templates/) for restrained software/fintech composition; [21st community catalog](https://21st.dev/community/components) for component discoverability; [shadcn Field](https://ui.shadcn.com/docs/components/base/field) for grouped labels/descriptions and responsive field semantics. No component source or restricted template was copied. UI UX Pro Max guidance reinforced visible labels, submit feedback and field validation. Existing brand assets/fonts/licenses are reused. Screenshot review findings belong in PASSPORT_QA.md, not inferred from static checks.
