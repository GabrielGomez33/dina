import { useMemo } from 'react';
import { API_BASE } from '../lib/apiConfig';

interface Props {
  /** Focus entity/topic to auto-load (usually the research's top entity or query). */
  focus: string;
  /** Which view to open first. */
  view?: 'network' | 'semantic';
}

// Embeds the proven, self-contained DIGIM graph viewer (network / timeline /
// semantic + on-demand node insights) as a console panel. The viewer is a
// separate, battle-tested tool served from /dina/graph-viewer.html; we drive it
// via URL params (embed chrome off, theme synced, focus auto-loaded) rather than
// re-implementing its 3D canvas — reuse over re-port, one source of truth.
export function ExploreView({ focus, view = 'network' }: Props) {
  const src = useMemo(() => {
    const theme = document.documentElement.getAttribute('data-theme') || '';
    const params = new URLSearchParams({ embed: '1', api: API_BASE, view });
    if (theme) params.set('theme', theme);
    if (focus) params.set('focus', focus);
    // BASE_URL may be '/dina' or '/dina/'; normalize so we always get
    // /dina/graph-viewer.html (not /dinagraph-viewer.html).
    const base = import.meta.env.BASE_URL.replace(/\/$/, '');
    return `${base}/graph-viewer.html?${params.toString()}`;
  }, [focus, view]);

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
