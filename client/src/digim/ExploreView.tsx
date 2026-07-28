import { useMemo } from 'react';
import { API_BASE } from '../lib/apiConfig';

// Cache-bust tag for the embedded graph-viewer.html. graph-viewer.html is an
// un-hashed static file, so a browser can keep serving a stale copy after a
// deploy. Appending ?v=<tag> makes the iframe request a URL the cache has never
// seen, forcing a fresh fetch. Bump this whenever graph-viewer.html changes.
const VIEWER_VERSION = '2026-07-28-compact-header';

interface Props {
  /** Focus entity/topic to auto-load (usually the research's top entity or query). */
  focus: string;
  /** The research (island) id. Scopes every graph/semantic/insight call to THIS
   *  research so unrelated researches can never bleed into the view. */
  researchId?: string;
  /** Which view to open first. */
  view?: 'network' | 'semantic';
}

// Embeds the proven, self-contained DIGIM graph viewer (network / timeline /
// semantic + on-demand node insights) as a console panel. The viewer is a
// separate, battle-tested tool served from /dina/graph-viewer.html; we drive it
// via URL params (embed chrome off, theme synced, focus auto-loaded) rather than
// re-implementing its 3D canvas — reuse over re-port, one source of truth.
export function ExploreView({ focus, researchId, view = 'network' }: Props) {
  const src = useMemo(() => {
    const theme = document.documentElement.getAttribute('data-theme') || '';
    const params = new URLSearchParams({ embed: '1', api: API_BASE, view });
    if (theme) params.set('theme', theme);
    if (focus) params.set('focus', focus);
    // Island scope: restrict the viewer to this research only.
    if (researchId) params.set('research', researchId);
    // Cache-bust: force the browser past any stale cached graph-viewer.html.
    params.set('v', VIEWER_VERSION);
    // BASE_URL may be '/dina' or '/dina/'; normalize so we always get
    // /dina/graph-viewer.html (not /dinagraph-viewer.html).
    const base = import.meta.env.BASE_URL.replace(/\/$/, '');
    return `${base}/graph-viewer.html?${params.toString()}`;
  }, [focus, researchId, view]);

  if (!focus) {
    return <div className="panel muted">No focus entity to explore for this research.</div>;
  }

  return (
    <div className="explore">
      <iframe
        key={src}
        className="explore-frame"
        src={src}
        title={`Relationship explorer for ${focus}`}
        loading="lazy"
      />
    </div>
  );
}
