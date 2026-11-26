---
name: IncomeFlow
description: Personal income. Purposefully allocated.
colors:
  "paper": "#fff"
  "ground": "#f5f7f6"
  "ink": "#172b27"
  "muted": "#52645e"
  "line": "#dce4df"
  "action": "#165d4c"
  "action-hover": "#104636"
  "action-ink": "#fff"
  "soft": "#e8f0ec"
  "blue": "#627c95"
  "gold": "#a6813c"
  "blue-soft": "#eaf0f5"
  "gold-soft": "#f7f0df"
  "error": "#a33127"
  "error-soft": "#fff1ee"
  "warning": "#785314"
  "selection": "#c8e3d7"
  "dark": "#142f27"
  "dark-ink": "#f2f7f4"
  "dark-muted": "#c1d4c9"
  "focus": "#0e7863"
  "theme-dark-paper": "#192e28"
  "theme-dark-ground": "#10201b"
  "theme-dark-ink": "#f0f6f2"
  "theme-dark-muted": "#b3c6bb"
  "theme-dark-line": "#40584c"
  "theme-dark-action": "#adddc6"
  "theme-dark-action-hover": "#c4e8d6"
  "theme-dark-action-ink": "#102c20"
  "theme-dark-soft": "#253e32"
  "theme-dark-blue": "#a9c3dc"
  "theme-dark-gold": "#d7b976"
  "theme-dark-blue-soft": "#293d4f"
  "theme-dark-gold-soft": "#403a27"
  "theme-dark-error": "#ffb8a7"
  "theme-dark-error-soft": "#432a24"
  "theme-dark-selection": "#2e6650"
  "theme-dark-focus": "#b5efcf"
typography:
  display:
    fontFamily: "Manrope, sans-serif"
    fontSize: "clamp(42px, 5.1vw, 70px)"
    fontWeight: 800
    lineHeight: 1.08
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Manrope, sans-serif"
    fontSize: "36px"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "-0.035em"
  section:
    fontFamily: "Manrope, sans-serif"
    fontSize: "26px"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "-0.035em"
  title:
    fontFamily: "Manrope, sans-serif"
    fontSize: "17px"
    fontWeight: 600
    lineHeight: 1.2
  body:
    fontFamily: "Manrope, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: "Manrope, sans-serif"
    fontSize: "13px"
    fontWeight: 600
  address:
    fontFamily: "monospace"
    fontSize: "13px"
rounded:
  "control": "8px"
  "panel": "14px"
  "preview": "16px"
  "tag": "5px"
spacing:
  "hairline": "1px"
  "1": "4px"
  "5": "20px"
  "10": "40px"
  "20": "80px"
  "24": "96px"
  "30": "120px"
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "6": "24px"
  "8": "32px"
  "12": "48px"
  "16": "64px"
components:
  button-primary:
    backgroundColor: "{colors.action}"
    textColor: "{colors.action-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "12px 20px"
  button-primary-hover:
    backgroundColor: "{colors.action-hover}"
  button-secondary:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "12px 20px"
  button-subtle:
    backgroundColor: "transparent"
    textColor: "{colors.muted}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "12px 20px"
  button-danger:
    backgroundColor: "{colors.error}"
    textColor: "{colors.paper}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "12px 20px"
  button-disabled:
    backgroundColor: "{colors.line}"
    textColor: "{colors.ink}"
  input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "12px"
  panel:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
    padding: "32px"
  allocation-preview:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.preview}"
    padding: "32px"
  workspace-navigation:
    textColor: "{colors.muted}"
    padding: "12px 1px 16px"
  status-tag:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.muted}"
    rounded: "{rounded.tag}"
    padding: "4px 8px"
---

# Design System: IncomeFlow

## Overview

**Creative North Star: "The allocation rail"**

IncomeFlow is a calm allocation workbench for independent professionals organizing crypto income. The branching ledger mark and the repeated allocation rail connect incoming payments to named destinations. Pine actions, generous task boundaries and precise numbers make the workspace feel controlled and inspectable.

Manrope carries both the brand and operating interface. Light paper surfaces support daytime work; the dark theme maps the same semantic roles onto deep green surfaces. Color reinforces categories and status while labels, percentages and receipt text carry their meaning.

**Key Characteristics:**

- Branching ledger identity and recurring allocation rails.
- One locally hosted type family with clear weight and numeric hierarchy.
- Flat paper surfaces, thin separators and restrained rounded controls.
- Honest illustration, preview, testnet and confirmed-receipt labels.

Captured from the approved implementation in `src/app/globals.css`, `src/components/shared.tsx` and `src/components/workspace.tsx`, with current rendered light and dark screens inspected on November 25, 2026. Existing research and asset provenance remain in `docs/DESIGN_SYSTEM.md`; this portable snapshot complements that document.

## Colors

The palette combines pine and green-tinted neutrals with slate blue and ochre allocation accents. Frontmatter records the source CSS values; keys prefixed `theme-dark-` are the corresponding dark-theme overrides, not additional colors to mix into a light screen.

### Primary

- **Pine action:** `action` and `action-hover` identify the primary action, selected navigation and first allocation. `action-ink` supplies its readable foreground.
- **Soft pine:** `soft` groups contextual notices and transient hover treatments.

### Secondary

- **Slate blue:** `blue` and `blue-soft` identify the second allocation alongside its text label.

### Tertiary

- **Ochre:** `gold` and `gold-soft` identify the third allocation alongside its text label.

### Neutral

- **Paper and ground:** `paper` holds operating panels; `ground` separates the surrounding workspace.
- **Ink and subdued ink:** `ink` carries task headings and values; `muted` carries descriptions and supporting labels.
- **Ledger line:** `line` separates rows, panels and inactive controls.
- **Deep pine:** `dark`, `dark-ink` and `dark-muted` form the dedicated dark marketing/control surface.
- **Error and warning:** `error`, `error-soft` and `warning` communicate problems with explicit text.
- **Focus and selection:** `focus` and `selection` theme browser interaction feedback.

**The Allocation Meaning Rule.** Pair each allocation color with its category and exact percentage; color alone never defines the destination.

## Typography

**Display and Body Font:** locally hosted Manrope, with a sans-serif fallback. Static weights (400, 600 and 800) are declared; font synthesis is disabled. The brand wordmark uses the strongest weight. Full addresses and code use monospace.

The frontmatter records desktop defaults. Marketing display text uses its fluid scale; workspace headings reduce to (29px) on phones. Marketing display becomes (50px) at the phone breakpoint and (42px) at the narrow breakpoint. Body copy uses a comfortable measure capped at (68ch), with shorter measures where a panel requires them. Data uses tabular numerals.

- **Display:** bold marketing headline, with a tight but readable line height.
- **Headline and section:** workspace and section boundaries, clearly separated from supporting text.
- **Title:** compact panel and receipt headings.
- **Body and label:** regular explanatory copy and semibold control labels.
- **Supporting data:** recipient fragments use (13px); payment status and synchronization labels use (12px).

**The One Family Rule.** Use Manrope throughout the interface; reserve monospace for full addresses and code.

## Layout

The main container is capped at (1200px), with desktop outer gutters of (32px). At the phone breakpoint, gutters become (20px); at the narrow breakpoint they become (16px). Use the frontmatter spacing scale: compact related groups sit inside larger task boundaries.

Desktop overview and editor layouts divide summary and working content into two columns. At (760px) and below, panels and forms stack; the allocation preview precedes the rule editor. Payment rows recompose into readable receipts rather than retaining a wide table. The header wraps its main navigation beneath the brand and wallet controls. The five workspace links remain in a compact row; the final phone tab gap is (12px), with smaller label text at narrow widths. The wallet label shortens at (380px) and below.

Additional layout adaptations exist at (1000px) and (1600px). Preserve the actual content hierarchy when adding screens; do not infer one universal hero composition from the landing page.

## Elevation & Depth

The implementation uses no box-shadow vocabulary. Ground, paper, contextual soft surfaces and thin borders provide depth; the dark control section supplies a stronger tonal boundary. The wallet menu remains a bounded paper surface rather than a glowing overlay.

**The Flat Surfaces Rule.** Separate content with tone, spacing and a thin border rather than adding decorative shadows.

## Shapes

The branching ledger SVG is the identity source: preserve its proportions and use matching light/dark treatments. Geometry expresses allocation rather than decorative finance symbolism.

Panels use the panel radius; the illustrative allocation preview is slightly rounder. Controls and inputs use the control radius; small status tags use the tag radius. Use thin strokes and separators. Allocation rails are compact horizontal segments, with pine, slate and ochre matched to their labeled destination rows.

## Components

### Buttons

Primary actions are confident pine controls with contrasting text. Secondary controls use paper and a thin ledger border; subtle actions use the muted foreground; recovery actions use the error role. Regular buttons have a minimum height of (46px); compact and icon controls retain at least (44px) touch targets. Hover changes the surface, active reduces opacity, and disabled controls use the ledger-line surface with ink text and an unavailable cursor. Focus uses a visible (2px) outline offset by (4px).

### Inputs / Fields

Inputs use paper, an ink foreground, a muted thin border and the control radius. Standard inputs have at least (44px) height. Theme the caret and placeholder through semantic tokens. Labels remain visible; validation appears beside the affected field and is linked through accessible descriptions. Allocation totals explain the required complete split. Drafts are identified and preserved in the current browser tab, with an explicit discard action; only the owner can save on-chain.

### Navigation

Main navigation uses text links. Workspace navigation uses a bottom separator, subdued inactive labels and a pine underline for the active destination. Keep all five labels readable at phone widths; selected meaning is also conveyed through weight and `aria-current`.

### Tags / Status

Small bounded tags communicate contextual facts such as preview/version/read-only viewing. They are supporting labels rather than primary actions. Receipt status pairs an icon or text with semantic color, and completed distribution remains distinct from deposit submission.

### Panels / Containers

Operating panels use paper, the panel radius and a thin ledger border, with default padding from the large component spacing step. Phones reduce padding where needed. Avoid nested boxes unless an actual notice, editor field group or separate decision requires one.

### Allocation Rail and Receipts

The segmented rail displays actual configured shares or a clearly labeled illustrative preview. Destination rows repeat the category color with readable category, recipient fragment and percentage. Receipt details progressively disclose the observed origin transfer, Reactive execution, authenticated callback and actual recipient transfers; unknown stages remain unknown.

### Motion

Micro-interactions use the existing duration token (180ms) for background color, foreground color, opacity and relevant transforms. Reduced-motion preference removes animation and transitions and disables smooth scrolling. Content and values are visible without entrance effects; lifecycle changes follow actual evidence.

## Do's and Don'ts

### Do:

- **Do** preserve the branching ledger mark, pine identity and Manrope typography.
- **Do** keep the five workspace destinations legible and reachable at phone widths.
- **Do** use semantic theme variables so light and dark surfaces remain coherent.
- **Do** show category labels and exact amounts beside allocation colors.
- **Do** provide visible focus, field-linked errors, preserved drafts and explicit disabled-state explanations.
- **Do** label illustrations, previews and testnet funds where users make decisions.

### Don't:

- **Don't** replace the mark with a shield, coin, hexagon or decorative arrow.
- **Don't** introduce gradients, glass effects or fabricated balance animations into the approved workbench.
- **Don't** use color as the only status or allocation signal.
- **Don't** present a submitted deposit as a confirmed distribution.
- **Don't** create decorative uppercase eyebrows or introduce a second display family.
