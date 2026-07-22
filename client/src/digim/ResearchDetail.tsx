import type { ResearchRecord } from '../lib/types';

interface Props {
  id: string;
  record: ResearchRecord | null;
  loading: boolean;
  error: Error | null;
  onRetry: () => void;
}

function host(u: string): string {
  try {
    return new URL(u).hostname.replace(/^www\./, '');
  } catch {
    return u;
  }
}

// The detail view for one past research: the briefing, key insights, entities,
// caveats, and the sources/documents behind it. Purely presentational — the page
// owns fetching; this renders whatever state it's handed.
export function ResearchDetail({ record, loading, error, onRetry }: Props) {
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

      {record.summary && (
        <section className="research-section">
          <h2>Briefing</h2>
          <p className="research-summary">{record.summary}</p>
        </section>
      )}

      {record.keyInsights.length > 0 && (
        <section className="research-section">
          <h2>Key insights</h2>
          <ul className="bullets">
            {record.keyInsights.map((k, i) => (
              <li key={i}>{k}</li>
            ))}
          </ul>
        </section>
      )}

      {record.entities.length > 0 && (
        <section className="research-section">
          <h2>Entities</h2>
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
        <section className="research-section">
          <h2>Caveats</h2>
          <ul className="bullets caveats">
            {record.caveats.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </section>
      )}

      {(record.documents?.length || record.sources.length) > 0 && (
        <section className="research-section">
          <h2>Sources</h2>
          <div className="sources">
            {(record.documents && record.documents.length > 0
              ? record.documents.map((d) => ({ url: d.url, title: d.title || host(d.url), provider: d.provider }))
              : record.sources.map((u) => ({ url: u, title: host(u), provider: '' }))
            ).map((s, i) => (
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
    </article>
  );
}
