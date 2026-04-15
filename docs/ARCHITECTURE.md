# Architecture

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js | 16.2.3 |
| UI | React | 19.2.4 |
| Language | TypeScript | 5 (strict mode) |
| Styling | Tailwind CSS + CSS Modules | 4.x |
| Animation | Framer Motion + custom spring physics | 11.x |
| Fonts | ClashDisplay (display), Instrument Serif (body) | Local + Google |

## Project Structure

The Next.js app lives inside the `pavan/` subdirectory. GitHub Actions and docs live at the repo root.

```
istanbul/
├── .github/workflows/    CI/CD pipelines
├── docs/                 Auto-generated documentation
└── pavan/                Next.js application
    ├── app/
    │   ├── components/   All UI components
    │   ├── playground/   Demo/playground page
    │   ├── globals.css   Design tokens + base styles
    │   ├── layout.tsx    Root layout (wraps with Shell)
    │   └── page.tsx      Home page
    ├── lib/              Utilities (spring physics, text helpers)
    ├── public/           Static assets (fonts, avatar)
    ├── next.config.ts    Turbopack configuration
    └── tsconfig.json     TypeScript config (strict)
```

## Styling Approach

- **CSS Modules** (`.module.css`) for all component styles — no Tailwind classes in JSX
- **CSS custom properties** for theming, defined in `globals.css`
- Tailwind imported but used only via `@apply` or utility layers, not inline

## Design Tokens

Defined in `pavan/app/globals.css` as CSS custom properties:

### Colors
| Token | Value | Usage |
|-------|-------|-------|
| `--ink` | `#0b0b0a` | Primary text |
| `--ink-muted` | `rgba(11,11,10,0.6)` | Secondary text |
| `--ink-hush` | `rgba(11,11,10,0.18)` | Borders |
| `--paper` | `#faf9f6` | Page background |
| `--paper-pure` | `#ffffff` | Pure white |
| `--accent-target` | `#c24e1b` | Warm rust accent |
| `--chat-surface` | `#f9f8f4` | Chat widget background |
| `--chat-surface-elevated` | `#f7f6f2` | Chat input area |
| `--chat-user-bubble` | `rgba(11,11,10,0.03)` | User message bubble |

### Easings
| Token | Value |
|-------|-------|
| `--ease-stroke` | `cubic-bezier(0.22, 0.61, 0.36, 1)` |
| `--ease-ink` | `cubic-bezier(0.16, 1, 0.3, 1)` |
| `--ease-breath` | `cubic-bezier(0.35, 0, 0.65, 1)` |

### Layout
| Token | Value |
|-------|-------|
| `--measure` | `504px` (content max-width) |
| `--chrome-pad` | `24px` (standard padding) |

## Animation Approach

Two animation systems coexist:

1. **Framer Motion** — Used for layout morphing (ChatBar), sliding indicators (Nav `layoutId`), and hover interactions (Avatar spring scale). Preferred for GPU-accelerated transforms.

2. **Custom spring physics** (`lib/spring.ts`) — Used by PointerProvider-subscribed components (CustomCursor, MagneticLine, BreathingProse) that need per-frame pointer tracking via `requestAnimationFrame`.

## Key Patterns

- **Shell wrapper** (`Shell.tsx`): Client component that wraps all pages, provides PointerProvider context, manages loading state, and orchestrates color bleed animations via staggered class additions.
- **`data-cursor=""`**: Attribute added to interactive elements to trigger custom cursor hover ring effect.
- **Content veil**: `.content-veil[data-loaded]` controls page fade-in after loader completes.
- **Color bleed**: Progressive accent color reveals via `bleed-links`, `bleed-cursor`, `bleed-rule` body classes on timers.

## Z-Index Layers

| Layer | Z-Index | Component |
|-------|---------|-----------|
| Loader overlay | 100 | HersheyLoader |
| Custom cursor | 80 | CustomCursor |
| Chat widget | 60 | ChatBar |
| Nav + Avatar | 40 | Nav, Avatar |
