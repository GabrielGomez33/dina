# DINA — UI Design System

The design language every DINA surface (console shell, DIGIM, and future
modules) must follow. This is the **planner's UI contract**: build to it, don't
improvise per page.

## Direction

**White on black. Sleek, spacious, professional, intuitive.** A near-black,
layered canvas with soft grey text, one pastel accent that glows, generous
whitespace, rounded corners, and depth from subtle shadows + hairline borders.
Think high-end product minimalism (dark studio photography, monochrome UI with a
single warm/pastel highlight) — not a busy dashboard.

Dark is the **default and signature** look; a clean light theme is the
secondary, fully-supported alternative.

## Principles

1. **Layered blacks, not one flat black.** Depth reads through 3–4 elevations of
   near-black: canvas → panel → raised → hover. Never a single `#000`.
2. **One pastel accent, used sparingly.** The accent is for focus, the active
   state, and one primary action per view — never as a fill you see ten times a
   screen. Semantic status colors (ok / warn / critical) are separate from it.
3. **Glow > hard highlight.** Active/hover/focus lift with a soft accent glow
   (blurred, low-opacity box-shadow), plus a 1px hairline. No neon, no harsh rings.
4. **Rounded + spacious.** Generous radius (cards ~16px, controls ~10–12px) and
   generous padding/gaps. Let content breathe; whitespace is a feature.
5. **Depth from shadow + border together.** Surfaces sit on a soft ambient shadow
   and carry a faint top-lit hairline. Elevation increases both.
6. **Type: quiet hierarchy.** A clean geometric/sans stack; tight, balanced
   headings; dimmed mono for metadata/labels. Uppercase micro-labels with letter-
   spacing. Text is grey-white on black, not pure `#fff`.

## Tokens (source of truth: `src/theme/tokens.css`)

### Dark (default)
| Token | Value | Role |
|---|---|---|
| `--bg` | `#0a0b0e` | deepest canvas |
| `--panel` | `#14171d` | card / surface |
| `--panel-2` | `#1b1f27` | raised / inset / hover |
| `--panel-3` | `#232833` | elevated / active hover |
| `--line` | `#272d38` | hairline border |
| `--ink` | `#eef1f6` | primary text (off-white) |
| `--ink-dim` | `#9aa5b3` | secondary text (grey) |
| `--ink-faint` | `#697382` | tertiary / captions |
| `--accent` | `#6fe0cf` | pastel aqua — the single highlight |
| `--accent-2` | `#f2c79b` | warm pastel — rare secondary highlight |

### Pastel type palette (entities / categories, both themes)
person `#8fb3ff` · organization `#c4a7f0` · location `#78e3c4` · event `#f2c79b`
· technology `#a6b2ff` · concept `#9aa7b8`

### Semantic status (separate from the accent)
ok `#5fd0a8` · warn `#f2c07f` · critical `#f38ba0`

### Depth
- `--radius` 12px controls · `--radius-lg` 16px cards
- `--shadow` ambient soft drop shadow (layered)
- `--glow` accent glow for active/focus (blurred, low-opacity)

Style **through tokens** — never hard-code a hex in a component. Both themes are
first-class: redefine only the tokens under `:root[data-theme="light"]`.

## Component conventions

- **Cards / panels:** `--panel`, `--radius-lg`, hairline `--line`, `--shadow`;
  on hover, border → accent-tinted + a faint `--glow`.
- **Primary button:** accent text/border on a translucent accent wash, glow on
  hover. **Secondary:** `--panel-2` + hairline. Both `--radius`.
- **Focus:** always a visible accent glow ring (keyboard-accessible).
- **Inputs:** `--panel-2`, hairline, `--radius`; focus adds accent border + glow.
- **Active nav / tab:** accent text + accent-tinted wash + a soft glow, not a
  heavy fill.
- **Motion:** short, eased (150–220ms); respect `prefers-reduced-motion`.

## Anti-goals

Flat pure-black; a rainbow of accents; neon; hard 2px colored rings; cramped
spacing; sharp corners; pure `#ffffff` text on pure `#000000`.
