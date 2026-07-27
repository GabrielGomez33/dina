import { useState } from 'react';
import type { ResearchRecord } from '../lib/types';
import { ExploreView } from './ExploreView';

interface Props {
  id: string;
  record: ResearchRecord | null;
  loading: boolean;
  error: Error | null;
  onRetry: () => void;
}

type Tab = 'briefing' | 'explore';

function host(u: string): string {
  try {
    return new URL(u).hostname.replace(/^www\./, '');
  } catch {
    return u;
  }
}

// The detail view for one past research: the briefing + a collapsible Insights
// panel (key insights, entities, caveats), plus the interactive Explore graph.
// Purely presentational — the page owns fetching; this renders what it's handed.
export function ResearchDetail({ record, loading, error, onRetry }: Props) {
  const [tab, setTab] = useState<Tab>('briefing');
  const [insightsOpen, setInsightsOpen] = useState(true);

  if (loading) return <div className="panel muted">Loading research…</div>;
  if (error)
    return (
      <div className="panel error-panel" role="alert">
        <h2>Couldn't load this research</h2>
        <p className="muted">{error.message}</p>
        <button className="btn" onClick={onRetry}>
          Retry
        </button>
      </div>
    );
  if (!record) return <div className="panel muted">Research not found.</div>;

  const conf = Math.round((record.confidence || 0) * 100);
  const canExplore = record.entities.length > 0;
  // Guard against a stale 'explore' selection when moving to an entity-less
  // research (Explore tab is hidden then, so fall back to the briefing).
  const activeTab: Tab = canExplore ? tab : 'briefing';

  const hasInsights =
    record.keyInsights.length > 0 || record.entities.length > 0 || record.caveats.length > 0;

  const sources =
    record.documents && record.documents.length > 0
      ? record.documents.map((d) => ({ url: d.url, title: d.title || host(d.url), provider: d.provider }))
      : record.sources.map((u) => ({ url: u, title: host(u), provider: '' }));

  return (
    <article className="research">
      <header className="research-head">
        <h1>{record.query}</h1>
        <div className="research-meta">
          <span className={'level level-' + record.level}>{record.level}</span>
          {record.generatedAt && <span>{new Date(record.generatedAt).toLocaleString()}</span>}
          <span>{conf}% confidence</span>
          <span>{record.sourceCount} sources</span>
          {record.model && <span className="mono">{record.model}</span>}
        </div>
      </header>

      <div className="detail-tabs" role="tablist">
        <button
          role="tab"
          aria-selected={activeTab === 'briefing'}
          className={'detail-tab' + (activeTab === 'briefing' ? ' active' : '')}
          onClick={() => setTab('briefing')}
        >
          Briefing
        </button>
        {canExplore && (
          <button
            role="tab"
            aria-selected={activeTab === 'explore'}
            className={'detail-tab' + (activeTab === 'explore' ? ' active' : '')}
            onClick={() => setTab('explore')}
          >
            Explore graph
          </button>
        )}
      </div>

      {activeTab === 'explore' && canExplore && (
        <ExploreView focus={record.entities[0].text} researchId={record.id} />
      )}

      {activeTab === 'briefing' && (
        <div className={'research-layout' + (insightsOpen && hasInsights ? '' : ' no-rail')}>
          {/* Main column: the narrative briefing + sources. */}
          <div className="research-body">
            {record.summary && (
              <section className="research-section">
                <h2>Briefing</h2>
                <p className="research-summary">{record.summary}</p>
              </section>
            )}

            {sources.length > 0 && (
              <section className="research-section">
                <h2>Sources</h2>
                <div className="sources">
                  {sources.map((s, i) => (
                    <a key={i} className="source" href={s.url} target="_blank" rel="noopener noreferrer">
                      <span className="source-title">{s.title}</span>
                      <span className="source-host">
                        {host(s.url)}
                        {s.provider ? ` · ${s.provider}` : ''}
                      </span>
                    </a>
                  ))}
                </div>
              </section>
            )}

            {!record.summary && sources.length === 0 && (
              <p className="muted">No briefing text was generated for this research.</p>
            )}
          </div>

          {/* Collapsible Insights rail: key insights, entities, caveats. */}
          {hasInsights && (
            <aside className={'insights-rail' + (insightsOpen ? ' open' : ' collapsed')}>
              <div className="insights-head">
                <h2>Insights</h2>
                <button
                  className="icon-btn"
                  onClick={() => setInsightsOpen((v) => !v)}
                  aria-expanded={insightsOpen}
                  aria-label={insightsOpen ? 'Collapse insights' : 'Expand insights'}
                  title={insightsOpen ? 'Collapse' : 'Expand'}
                >
                  <span aria-hidden>{insightsOpen ? '⟩' : '⟨'}</span>
                </button>
              </div>

              {insightsOpen && (
                <div className="insights-body">
                  {record.keyInsights.length > 0 && (
                    <section className="insight-group">
                      <h3>Key insights</h3>
                      <ul className="bullets">
                        {record.keyInsights.map((k, i) => (
                          <li key={i}>{k}</li>
                        ))}
                      </ul>
                    </section>
                  )}

                  {record.entities.length > 0 && (
                    <section className="insight-group">
                      <h3>Entities</h3>
                      <div className="chips">
                        {record.entities.map((e, i) => (
                          <span key={i} className={'chip t-' + (e.type || 'other')}>
                            {e.text}
                          </span>
                        ))}
                      </div>
                    </section>
                  )}

                  {record.caveats.length > 0 && (
                    <section className="insight-group">
                      <h3>Caveats</h3>
                      <ul className="bullets caveats">
                        {record.caveats.map((c, i) => (
                          <li key={i}>{c}</li>
                        ))}
                      </ul>
                    </section>
                  )}
                </div>
              )}
            </aside>
          )}
        </div>
      )}
    </article>
  );
}
