import type { ResearchSummary } from '../lib/types';

interface Props {
  items: ResearchSummary[];
  total: number;
  loading: boolean;
  error: Error | null;
  search: string;
  onSearch: (v: string) => void;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onRetry: () => void;
}

function fmtDate(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
}

// The chat-like history rail: a searchable, selectable list of past researches.
// Loading / error / empty are all explicit states, never a blank panel.
export function HistorySidebar({
  items,
  total,
  loading,
  error,
  search,
  onSearch,
  selectedId,
  onSelect,
  onNew,
  onRetry,
}: Props) {
  return (
    <aside className="history" aria-label="Research history">
      <div className="history-head">
        <button className="btn primary block" onClick={onNew}>
           + New research
        </button>
        <input
          className="history-search"
          type="search"
          placeholder="Search researches…"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          aria-label="Search researches"
        />
      </div>

      <div className="history-list" role="list">
        {loading && <div className="history-hint">Loading…</div>}

        {error && (
          <div className="history-hint error" role="alert">
            {error.message}
            <button className="btn small" onClick={onRetry}>
              Retry
            </button>
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="history-hint">
            {search ? 'No researches match your search.' : 'No researches yet — run your first one.'}
          </div>
        )}

        {!loading &&
          !error &&
          items.map((it) => (
            <button
              key={it.id}
              role="listitem"
              className={'history-item' + (it.id === selectedId ? ' active' : '')}
              onClick={() => onSelect(it.id)}
              title={it.query}
            >
              <span className="hi-query">{it.query || '(untitled research)'}</span>
              <span className="hi-meta">
                <span className={'level level-' + it.level}>{it.level}</span>
                <span>{fmtDate(it.generatedAt)}</span>
                <span>{it.sourceCount} src</span>
              </span>
              {it.snippet && <span className="hi-snippet">{it.snippet}</span>}
            </button>
          ))}
      </div>

      {!loading && !error && total > items.length && (
        <div className="history-foot muted">
          Showing {items.length} of {total}
        </div>
      )}
    </aside>
  );
}
