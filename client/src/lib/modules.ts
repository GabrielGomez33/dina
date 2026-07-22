// ============================================================================
// DINA module registry — the single source of truth for the console's modules.
// Adding a DINA module later means adding one entry here + one route; the nav,
// home grid, and routing all read from this list. No scattered module lists.
// ============================================================================

export interface DinaModule {
  key: string;
  label: string;
  path: string;
  blurb: string;
  glyph: string; // single emoji/char used as a lightweight icon
  status: 'live' | 'planned';
}

export const MODULES: DinaModule[] = [
  {
    key: 'digim',
    label: 'DIGIM',
    path: '/digim',
    blurb: 'Gather, research, and see the relationships across the open web.',
    glyph: '🕸️',
    status: 'live',
  },
  {
    key: 'mirror',
    label: 'Mirror',
    path: '/mirror',
    blurb: 'Reflective analysis module.',
    glyph: '🪞',
    status: 'planned',
  },
  {
    key: 'llm',
    label: 'LLM',
    path: '/llm',
    blurb: 'Direct model interaction and tooling.',
    glyph: '✦',
    status: 'planned',
  },
];

export const liveModules = () => MODULES.filter((m) => m.status === 'live');
