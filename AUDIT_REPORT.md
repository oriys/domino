# Domino API Hub — Interface Quality Audit Report

**Date**: 2026-03-08  
**Scope**: Full UI audit across accessibility, performance, theming, responsive design, and anti-patterns  
**Files audited**: 25+ components, globals.css, layout.tsx, all api-platform components, all UI primitives

---

## Anti-Patterns Verdict

**Pass.** This interface does *not* look AI-generated. It avoids the major AI slop tells:

- ✅ No cyan-on-dark / purple-to-blue gradient palette
- ✅ No gradient text on headings or metrics
- ✅ No glassmorphism or glow borders
- ✅ No hero metric layout template (big number + small label)
- ✅ No bounce/elastic easing
- ✅ Color tokens use OKLCH (perceptually uniform) with hue-tinted neutrals — not dead grays
- ✅ Cards are used purposefully (not nested cards-in-cards)
- ✅ Typography uses Geist with system fallbacks — distinctive but not generic

**Minor tells present**:
- Uniform spacing in some areas (editor sections all use identical padding/gaps — could benefit from more spatial rhythm)
- The "identical card grid" pattern is present in the API board (same-sized cards repeated), though it's justified here for a list view

---

## Executive Summary

| Severity | Count |
|----------|-------|
| 🔴 Critical | 4 |
| 🟠 High | 7 |
| 🟡 Medium | 9 |
| ⚪ Low | 6 |
| **Total** | **26** |

### Top 5 Most Critical Issues

1. **Touch targets below 44px across the entire app** — 30+ icon buttons at `h-6`/`h-8` (24–32px)
2. **Onboarding modal has no focus trap** — keyboard users can Tab into background content
3. **Form inputs missing label associations** — `<Label>` not connected via `htmlFor`/`id` throughout api-editor
4. **Hard-coded Tailwind colors bypass design tokens** — `amber-*`, `blue-*` used in 6 files (15+ instances)
5. **Tables force horizontal scroll on mobile** — 5-column tables in preview have no mobile adaptation

### Overall Quality Score

| Dimension | Score | Notes |
|-----------|-------|-------|
| Accessibility | 5/10 | Good primitives (Radix), poor wiring (labels, focus, touch targets) |
| Performance | 8/10 | Mostly clean; 2 layout property animations |
| Theming | 7/10 | Excellent OKLCH token system; spoiled by hard-coded color leaks |
| Responsive | 6/10 | Desktop-first in several areas; tables and sidebar break on mobile |
| Anti-Patterns | 9/10 | Clean, intentional design — not AI slop |

---

## Detailed Findings by Severity

### 🔴 Critical Issues

#### C1 — Touch targets below 44px (systemic)
- **Location**: 30+ icon buttons across `header.tsx`, `api-editor.tsx`, `api-list.tsx`, `api-preview.tsx`, `publish-workflow.tsx`, `visual-doc-editor.tsx`, `onboarding-guide.tsx`
- **Category**: Accessibility
- **Description**: Buttons using `h-6 w-6` (24px), `h-7 w-7` (28px), and `h-8 w-8` (32px) all fail the WCAG 2.5.5 Target Size minimum of 44×44 CSS pixels. This affects every Trash/Delete icon, header utility buttons, and card action menus.
- **Impact**: Touch/mobile users can't reliably tap these controls. Accessibility violation.
- **WCAG**: 2.5.5 Target Size (Level AAA), 2.5.8 Target Size Minimum (Level AA, 24px min with spacing)
- **Recommendation**: Set minimum button size to `h-10 w-10` (40px) for icon buttons, or expand tap target via padding/pseudo-elements. The `sm` and `icon` button variants in `button.tsx` should default to at least 40px.
- **Suggested command**: `/harden`

#### C2 — Onboarding modal missing focus trap
- **Location**: `components/api-platform/onboarding-guide.tsx`, lines 278–380
- **Category**: Accessibility
- **Description**: The onboarding tour overlay renders a full-screen modal experience but doesn't trap keyboard focus. Users pressing Tab can reach and interact with background elements behind the overlay. Focus is also not auto-set to the tooltip on step change, and not restored to the original element when the tour closes.
- **Impact**: Keyboard-only and screen reader users can interact with hidden content, causing confusion and potential data loss.
- **WCAG**: 2.4.3 Focus Order (Level A), 2.1.2 No Keyboard Trap (Level A)
- **Recommendation**: Wrap tooltip content in a FocusTrap (e.g., Radix `FocusScope` or a custom trap). Auto-focus the first actionable button on each step. Restore focus to the trigger element on close.
- **Suggested command**: `/harden`

#### C3 — Form inputs missing label associations (systemic)
- **Location**: `api-editor.tsx` (lines 226–275, 714, 807–843, 880–895, 931, 955), `publish-workflow.tsx` (lines 289, 413)
- **Category**: Accessibility
- **Description**: Dozens of `<Label>` elements are not connected to their `<Input>`/`<Textarea>`/`<Checkbox>` via `htmlFor`↔`id` pairing. Some inputs use only `placeholder` text with no visible label at all (tag input, header name/value fields, cookie fields).
- **Impact**: Screen readers cannot associate labels with inputs. Users relying on assistive technology cannot determine what each field is for.
- **WCAG**: 1.3.1 Info and Relationships (Level A), 4.1.2 Name, Role, Value (Level A)
- **Recommendation**: Add unique `id` attributes to each form control and `htmlFor` on each `<Label>`. For inline fields (headers, cookies), use `aria-label` if visual labels are intentionally hidden.
- **Suggested command**: `/harden`

#### C4 — Onboarding spotlight animates layout properties
- **Location**: `onboarding-guide.tsx`, line 295–305 (inline styles)
- **Category**: Performance
- **Description**: The spotlight overlay animates `top`, `left`, `width`, and `height` via CSS transitions. These trigger layout recalculation on every frame. The transition also uses `box-shadow` for the overlay hole, which is composited but expensive at the `9999px` spread radius.
- **Impact**: Causes jank on lower-powered devices during tour navigation, especially on tablets/phones.
- **Recommendation**: Use `transform: translate(x, y)` and `transform: scale()` instead of `top`/`left`/`width`/`height`. Position the element at origin and use transforms to move/size it.
- **Suggested command**: `/optimize`

---

### 🟠 High-Severity Issues

#### H1 — Hard-coded Tailwind colors bypass design tokens
- **Location**: `api-preview.tsx` (8 instances: `amber-*`, `blue-*`), `api-list.tsx` (1), `audit-log-view.tsx` (1), `openapi-import.tsx` (1), `visual-doc-editor.tsx` (2), `doc-editor.tsx` (2)
- **Category**: Theming
- **Description**: 15+ instances of `amber-300`, `amber-50`, `amber-700`, `blue-200`, `blue-50`, `blue-500`, etc. used directly instead of semantic design tokens (`--warning`, `--success`, `--chart-*`). These won't adapt when the design token palette changes.
- **Impact**: Dark mode variants are manually duplicated with `dark:` prefix (fragile). Theming changes require finding and updating every instance.
- **WCAG**: N/A (design system consistency)
- **Recommendation**: Replace `amber-*` with `warning` token variants. Replace `blue-*` with `chart-1` or add an `--info` semantic token. Update both `:root` and `.dark` in globals.css.
- **Suggested command**: `/normalize`

#### H2 — Tables not adapted for mobile
- **Location**: `api-preview.tsx` (4 tables: field descriptions, path params, query params, cookies), `api-editor.tsx` (field editor grid)
- **Category**: Responsive
- **Description**: Tables with 4–5 columns use `overflow-x-auto` but have no mobile adaptation. At 320–375px viewport width, tables require horizontal scrolling. The field descriptions table (5 columns) is especially problematic.
- **Impact**: Mobile users must scroll horizontally to see field types, required flags, and descriptions. Poor usability on phones.
- **Recommendation**: Either stack table rows vertically on mobile (`@container` query or `sm:` breakpoint), hide non-essential columns, or use a card-based layout on narrow screens.
- **Suggested command**: `/adapt`

#### H3 — Onboarding spotlight ignores prefers-reduced-motion
- **Location**: `onboarding-guide.tsx`, line 302 (inline `transition: "all 0.3s cubic-bezier(...)"`), line 312 (`animate-in fade-in-0 zoom-in-95`), line 332 (`transition-all duration-300`)
- **Category**: Accessibility
- **Description**: The global `prefers-reduced-motion` rule in `globals.css` (lines 143–150) correctly disables all CSS animations. However, the onboarding spotlight uses **inline style transitions** which override the global rule. The `animate-in` class also may not be caught by the blanket override.
- **Impact**: Users with vestibular disorders still see the spotlight sliding/zooming between steps.
- **WCAG**: 2.3.3 Animation from Interactions (Level AAA)
- **Recommendation**: Check `prefers-reduced-motion` in JS (via `matchMedia`) and set `transition: none` on the spotlight when reduced motion is preferred.
- **Suggested command**: `/harden`

#### H4 — Sidebar animates `width` (layout property)
- **Location**: `sidebar.tsx`, line 61 (`transition-[width] duration-300`); `components/ui/sidebar.tsx`, line 221
- **Category**: Performance
- **Description**: Sidebar collapse/expand animates the CSS `width` property, which triggers layout recalculation for the entire page on every animation frame.
- **Impact**: Visible jank on slower devices during sidebar toggle. May also trigger reflows in the main content area.
- **Recommendation**: Use `transform: translateX()` for the sidebar slide, or use `grid-template-columns` transition (`0fr → 1fr` pattern) which is GPU-composited in modern browsers.
- **Suggested command**: `/optimize`

#### H5 — Heading hierarchy skips in api-preview
- **Location**: `api-preview.tsx` — `<h1>` at line 227 "API Preview", then `<h3>` at lines 313, 355, 388, etc.
- **Category**: Accessibility
- **Description**: The preview component jumps from `<h1>` directly to `<h3>`, skipping `<h2>`. Each documentation section (Authentication, Path Params, Query Params, Request, Response) uses `<h3>`.
- **Impact**: Screen reader users navigating by headings see a broken document outline — missing `h2` suggests content structure errors.
- **WCAG**: 1.3.1 Info and Relationships (Level A)
- **Recommendation**: Use `<h2>` for the top-level tab section names (Documentation, Code Examples, Try It) and `<h3>` for sub-sections within.
- **Suggested command**: `/harden`

#### H6 — Search dropdown not keyboard-accessible
- **Location**: `header.tsx`, lines 156–193
- **Category**: Accessibility
- **Description**: The global search results dropdown uses plain `<div>` and `<button>` elements without `role="listbox"` or `role="menu"`. There's no arrow-key navigation, no `aria-activedescendant`, and no focus management when results appear.
- **Impact**: Keyboard users can't navigate search results without clicking. Screen readers don't announce the results as a navigable list.
- **WCAG**: 4.1.2 Name, Role, Value (Level A), 2.1.1 Keyboard (Level A)
- **Recommendation**: Add `role="listbox"` to the dropdown container, `role="option"` to each result, implement arrow-key navigation with `aria-activedescendant` on the input.
- **Suggested command**: `/harden`

#### H7 — Badge component lacks semantic meaning for screen readers
- **Location**: `components/ui/badge.tsx`
- **Category**: Accessibility
- **Description**: Badges render as `<span>` with no `role` attribute. When used to convey status (e.g., "Published", "Draft", "Required", "Error"), screen readers may not convey the semantic importance. Particularly impactful for method badges (`GET`, `POST`) and status badges.
- **Impact**: Screen reader users may miss important status information.
- **WCAG**: 1.3.1 Info and Relationships (Level A)
- **Recommendation**: Add optional `role` prop (default `"status"` for status badges). In consuming components, add `aria-label` to badges that convey meaning beyond their visible text.
- **Suggested command**: `/harden`

---

### 🟡 Medium-Severity Issues

#### M1 — Pure white popover token
- **Location**: `globals.css`, line 12 — `--popover: oklch(1 0 0)`
- **Category**: Theming
- **Description**: `oklch(1 0 0)` is pure white with zero chroma. The color-and-contrast reference warns against pure white — even a tiny chroma (0.002–0.005) creates more natural surfaces.
- **Recommendation**: Change to `oklch(0.998 0.002 248)` to match the card token's tint.

#### M2 — Hard-coded rgba in onboarding spotlight
- **Location**: `onboarding-guide.tsx`, line 300; `globals.css`, lines 158–159
- **Category**: Theming
- **Description**: `rgba(0, 0, 0, 0.5)` and `rgba(0, 0, 0, 0.3)` are hard-coded instead of using the foreground token with alpha.
- **Recommendation**: Use `oklch(from var(--foreground) l c h / 0.5)` or Tailwind's `bg-foreground/50`.

#### M3 — Search input fixed width
- **Location**: `header.tsx`, line 147 — `w-80` (320px)
- **Category**: Responsive
- **Description**: The search input has a fixed width of `w-80`. On mobile viewports (320–375px), this may overflow or crowd other header elements.
- **Recommendation**: Use `w-full sm:w-80` or `max-w-80` to make it fluid on small screens.

#### M4 — Publish workflow sidebar fixed width
- **Location**: `publish-workflow.tsx`, line 189 — `w-72` (288px)
- **Category**: Responsive
- **Description**: Fixed 288px sidebar takes up ~80% of a 375px mobile viewport.
- **Recommendation**: Hide sidebar on mobile, use a step indicator bar instead. Or `w-full md:w-72`.

#### M5 — `<pre>` code blocks may overflow on mobile
- **Location**: `api-preview.tsx` — 9 instances of `<pre>` blocks with `overflow-x-auto`
- **Category**: Responsive
- **Description**: Long cURL commands and JSON bodies force horizontal scrolling within code blocks on narrow viewports. While `overflow-x-auto` prevents layout breakage, the UX is poor.
- **Recommendation**: Add `whitespace-pre-wrap break-all` for JSON blocks. For cURL, consider collapsible code or a "Copy" button with truncated visible preview.

#### M6 — Tooltip delay duration is 0ms
- **Location**: `components/ui/tooltip.tsx`, line 9 — `delayDuration={0}`
- **Category**: Accessibility
- **Description**: Tooltips appear instantly on hover. This can be disorienting for screen magnifier users and causes tooltip flicker when moving between adjacent tooltip triggers. Standard delay is 200–400ms.
- **Recommendation**: Set `delayDuration={200}` and add `skipDelayDuration={500}` for keyboard users.

#### M7 — Checkbox not connected to label in publish workflow
- **Location**: `publish-workflow.tsx`, line 413
- **Category**: Accessibility
- **Description**: "Notify subscribers" checkbox has no `id` and the adjacent label has no `htmlFor`. Clicking the label text doesn't toggle the checkbox.
- **Recommendation**: Add `id="notify-subscribers"` to Checkbox and `htmlFor="notify-subscribers"` on the label.

#### M8 — Switch component touch target is 32×18px
- **Location**: `components/ui/switch.tsx` — `w-8 h-[1.15rem]`
- **Category**: Accessibility
- **Description**: The Switch is only ~32×18px visually. While Radix handles keyboard interaction, the touch target is very small for mobile users.
- **Recommendation**: Expand the touch target area via padding or a pseudo-element overlay.

#### M9 — No `aria-live` region for save/publish feedback
- **Location**: `api-editor.tsx`, `publish-workflow.tsx`
- **Category**: Accessibility
- **Description**: When the user saves an API or publishes a release, feedback is shown visually (button text changes, success badge) but no `aria-live` region announces the result to screen readers.
- **Recommendation**: Ensure the Sonner toaster (already mounted in layout) is the primary feedback mechanism, and that toast messages are descriptive.

---

### ⚪ Low-Severity Issues

#### L1 — Redundant onboarding copy
- **Location**: `onboarding-guide.tsx` — "This tour takes about 30 seconds" (line 49), multiple "Tip:" blocks
- **Recommendation**: Tighten copy. Remove time estimate (subjective). Consolidate tips.
- **Suggested command**: `/clarify`

#### L2 — Editor field grid cramped on tablet
- **Location**: `api-editor.tsx`, line 224 — uses `xl:` breakpoint only for multi-column grid
- **Recommendation**: Add `lg:` intermediate layout for tablet viewport.
- **Suggested command**: `/adapt`

#### L3 — Missing tabular-nums on version strings
- **Location**: Version badges throughout (api-list, publish-workflow)
- **Recommendation**: Add `font-variant-numeric: tabular-nums` for aligned version numbers in lists.
- **Suggested command**: `/polish`

#### L4 — Empty states could be more actionable
- **Location**: `api-editor.tsx` — "No query parameters defined", "No custom headers defined", etc.
- **Recommendation**: Add a direct "Add one" link in empty state messages, following the UX writing principle that empty states are onboarding moments.
- **Suggested command**: `/clarify`

#### L5 — Tag input has no visible label
- **Location**: `api-editor.tsx`, line 714 — placeholder-only `"Add tag…"`
- **Recommendation**: Add `aria-label="Add tag"` at minimum.

#### L6 — Copy buttons in preview lack specific aria-labels
- **Location**: `api-preview.tsx` — Copy buttons for cURL, JS, Python examples all say just "Copy"
- **Recommendation**: Use `aria-label="Copy cURL example"`, `aria-label="Copy JavaScript example"`, etc.

---

## Patterns & Systemic Issues

| Pattern | Occurrences | Impact |
|---------|-------------|--------|
| Icon buttons below 44px touch target | 30+ across 10 files | Mobile usability, WCAG AA |
| `<Label>` without `htmlFor`/`id` binding | 20+ in editor, 2+ in publish | Screen reader support, WCAG A |
| Hard-coded Tailwind colors (`amber-*`, `blue-*`) | 15+ in 6 files | Theming consistency, dark mode fragility |
| `transition-[width]` on layout properties | 2 sidebar instances | Rendering performance |
| Tables with no mobile adaptation | 4 tables in preview | Mobile horizontal scrolling |
| `h-8 w-8` as the default icon button size | Convention across codebase | 32px is the _de facto_ standard — needs to become 40px |

---

## Positive Findings

These are working well and should be maintained:

- ✅ **OKLCH color system** — The entire token system uses perceptually uniform OKLCH with hue-tinted neutrals. This is state-of-the-art.
- ✅ **Skip-to-main-content link** — Properly implemented in `layout.tsx` with focus styling.
- ✅ **`<main id="main-content">`** — Correctly present in `page.tsx`.
- ✅ **Radix UI primitives** — Dialog, Tabs, Select, Switch, ScrollArea all use Radix with built-in a11y (focus trap, keyboard nav, ARIA).
- ✅ **Global reduced-motion support** — `globals.css` has a comprehensive `prefers-reduced-motion` blanket rule.
- ✅ **`aria-label` on most icon-only buttons** — Header buttons, dropdown menus, and delete buttons consistently have labels.
- ✅ **Semantic nav elements** — Sidebar uses `<nav>`, preview uses `<nav>` for "On This Page".
- ✅ **No pure black backgrounds** — Dark mode uses `oklch(0.11)` (darkest) and `oklch(0.08)` for sidebar, avoiding `#000`.
- ✅ **`font-display: swap` equivalent** — Font loading via Geist with system fallbacks avoids FOIT.
- ✅ **Design token architecture** — Two-layer system (primitive → semantic) with clean `:root`/`.dark` separation.
- ✅ **Onboarding guide** — 7-step tour with keyboard navigation (Arrow keys, Escape, Enter) and localStorage persistence.

---

## Recommendations by Priority

### 1. Immediate (Critical blockers)
- Fix onboarding focus trap (C2) — add `FocusScope` or equivalent
- Convert spotlight to `transform`-based positioning (C4) — eliminate layout property animation
- Add `prefers-reduced-motion` JS check to onboarding (H3) — respect user preference in inline styles

### 2. Short-term (This sprint)
- **Increase all icon button touch targets to ≥40px** (C1) — global change to button.tsx `icon` variant, plus individual overrides
- **Wire `htmlFor`/`id` on all form labels** (C3) — systematic pass through api-editor and publish-workflow
- **Replace hard-coded colors with tokens** (H1) — swap `amber-*` → `warning`, `blue-*` → `info`/`chart-1`
- **Make search dropdown keyboard-accessible** (H6) — add `role="listbox"` + arrow-key nav
- **Fix heading hierarchy in preview** (H5) — `h1` → `h2` → `h3`

### 3. Medium-term (Next sprint)
- Adapt tables for mobile (H2) — card-based layout or column hiding at `sm:` breakpoint
- Fix responsive issues in header search (M3) and publish sidebar (M4)
- Set tooltip delay to 200ms (M6)
- Add `aria-live` feedback for save/publish actions (M9)
- Connect checkbox labels in publish workflow (M7)

### 4. Long-term (Nice-to-haves)
- Add tabular-nums to version strings (L3)
- Improve empty state copy to be actionable (L4)
- Tighten onboarding guide copy (L1)
- Add tablet breakpoints to editor grids (L2)

---

## Suggested Commands for Fixes

| Command | Issues Addressed | Count |
|---------|-----------------|-------|
| `/harden` | C2, C3, H3, H5, H6, H7, M7, M9 | 8 |
| `/adapt` | H2, M3, M4, M5, L2 | 5 |
| `/optimize` | C4, H4 | 2 |
| `/normalize` | H1, M1, M2 | 3 |
| `/polish` | C1, M8, L3, L6 | 4 |
| `/clarify` | L1, L4, L5 | 3 |

**Recommended execution order**: `/harden` → `/normalize` → `/adapt` → `/optimize` → `/polish` → `/clarify`
