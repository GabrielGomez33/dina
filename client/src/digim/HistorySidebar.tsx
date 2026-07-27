import { useEffect, useMemo, useState } from 'react';
import type { ResearchSummary } from '../lib/types';

interface Props {
  id?: string;
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
  onClose?: () => void;
}

function fmtDate(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
}

// The chat-like history rail: a searchable, selectable list of past researches.
// Loading / error / empty are all explicit states, never a blank panel.
//
// Search is two-layered so it always feels responsive: the typed term filters
// the already-loaded list INSTANTLY on the client, and (debounced) is also sent
// to the server so results beyond the first page are reachable. The instant
// client filter is what makes typing feel like it "works" even before the
// network round-trip returns.
export function HistorySidebar({
  id,
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
  onClose,
}: Props) {
  const [term, setTerm] = useState(search);

  // Keep the box in sync if the parent resets the search (e.g. "New research").
  useEffect(() => setTerm(search), [search]);

  // Debounce the server query so we don't refetch on every keystroke.
  useEffect(() => {
    if (term === search) return;
    const t = setTimeout(() => onSearch(term.trim()), 280);
    return () => clearTimeout(t);
  }, [term, search, onSearch]);

  // Instant, case-insensitive client filter over what's loaded — matches the
  // query text and the snippet so results appear as you type.
  const shown = useMemo(() => {
    const q = term.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (it) =>
        (it.query || '').toLowerCase().includes(q) ||
        (it.snippet || '').toLowerCase().includes(q),
    );
  }, [items, term]);

  const showingCount = shown.length;

  return (
    <aside id={id} className="history" aria-label="Research history">
      <div className="history-head">
        <div className="history-head-row">
          <button className="btn primary block" onClick={onNew}>
            + New research
          </button>
          {onClose && (
            <button className="icon-btn history-close" onClick={onClose} aria-label="Hide researches" title="Hide">
              <span aria-hidden>×</span>
            </button>
          )}
        </div>
        <input
          className="history-search"
          type="search"
          placeholder="Search researches…"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          aria-label="Search researches"
        />
      </div>

      <div className="history-list" role="list">
        {loading && shown.length === 0 && <div className="history-hint">Loading…</div>}

        {error && (
          <div className="history-hint error" role="alert">
            {error.message}
            <button className="btn small" onClick={onRetry}>
              Retry
            </button>
          </div>
        )}

        {!loading && !error && shown.length === 0 && (
          <div className="history-hint">
            {term.trim() ? 'No researches match your search.' : 'No researches yet — run your first one.'}
          </div>
        )}

        {!error &&
          shown.map((it) => (
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

      {!error && (total > showingCount || term.trim()) && (
        <div className="history-foot muted">
          {term.trim()
            ? `${showingCount} match${showingCount === 1 ? '' : 'es'}${total > items.length ? ` · ${total} total` : ''}`
            : `Showing ${showingCount} of ${total}`}
        </div>
      )}
    </aside>
  );
}
