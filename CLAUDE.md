# Domino — AI Design Guidelines

## Design Context

### Users
API documentation teams — engineers, technical writers, and platform admins — working inside organizations that need centralized, versioned, and reviewed API publishing workflows. They arrive at Domino to create, edit, review, and publish API documentation under time pressure. They expect tools that stay out of the way and let them focus on content quality and accuracy.

### Brand Personality
**Precise · Trustworthy · Modern**

The interface should evoke **professionalism** — the quiet confidence of a tool that does exactly what it promises, reliably and without friction. Every interaction should feel intentional and considered. No whimsy, no flair for its own sake; every visual choice earns its place.

### Aesthetic Direction
- **Visual tone**: Minimal, clean, data-focused. Generous whitespace. Typography-led hierarchy.
- **Reference**: Notion — calm workspace energy, content-first layouts, understated chrome, effortless navigation.
- **Theme**: Light and dark modes (OKLCH token system), defaulting to system preference.
- **Typography**: Geist (sans) + Geist Mono — geometric, contemporary, Vercel-lineage. Slightly tightened letter-spacing for headings, generous line-height (1.8) for prose.
- **Color**: Blue-purple primary (oklch hue ~262°) conveying trust and technical competence. Hue-tinted neutrals (not dead grays). Semantic colors for status: green/success, orange/warning, red/destructive.
- **Shape**: Subtle radii (8px base). No heavy shadows, no gradients, no glow effects. Borders are soft and low-contrast.
- **Motion**: Purposeful transitions (150–200ms). Respect `prefers-reduced-motion`. No decorative animation.

### Design Principles

1. **Content over chrome** — The user's API documentation is the star. UI elements recede; content occupies the foreground. Reduce visual noise at every opportunity.

2. **Clarity through structure** — Use typographic hierarchy, consistent spacing, and semantic color to communicate meaning. Never rely on color alone. Labels, headings, and layout should make the interface self-explanatory.

3. **Quiet confidence** — The interface should feel solid and trustworthy. Avoid flashy gradients, animated backgrounds, or decorative flourishes. Subtle, considered details (hue-tinted neutrals, precise spacing, smooth transitions) signal quality without shouting.

4. **Accessible by default** — Target WCAG 2.1 AA. Touch targets ≥ 44px, all interactive elements labeled, proper heading hierarchy, focus management in modals, and color-blind-safe palettes. Accessibility is a baseline, not an afterthought.

5. **Systematic consistency** — Use the existing design token system (OKLCH CSS variables, shadcn/Radix primitives, CVA variants) for all new work. Never hard-code colors or spacing. Every component should feel like it belongs to the same family.

### Technical Design Constraints
- **Token system**: OKLCH CSS custom properties in `app/globals.css` — update both `:root` and `.dark` together.
- **Component library**: shadcn/ui + Radix primitives with `data-slot` attributes and CVA variants. Use `cn()` from `lib/utils.ts` for class merging.
- **Icons**: Lucide React (consistent 16px default via auto-sizing in Button).
- **Spacing**: Tailwind 4 utility scale (0.25rem increments). Card padding at 1.5rem. Consistent gap sizing.
- **Border radius**: `--radius: 0.5rem` (8px base), with sm (4px) and lg (12px) variants.
- **Fonts**: Geist + Geist Mono loaded via `next/font/local` in layout.
- **Anti-patterns to avoid**: AI-slop aesthetics (cyan-on-dark, gradient text, glassmorphism, glow borders, nested card-in-card layouts, hero metric templates).
