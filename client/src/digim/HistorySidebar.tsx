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

interface TreeNode {
  item: ResearchSummary;
  children: ResearchSummary[];
}

function fmtDate(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
}

// The chat-like history rail: a searchable, TREE of past researches. Multi-facet
// 'investigate' runs store each facet with a parent_id pointing at the fused
// investigation root, so here facets nest under their root as an expandable
// dropdown instead of cluttering the list as unrelated siblings.
//
// Search is two-layered so it always feels responsive: the typed term filters
// the already-loaded list INSTANTLY on the client, and (debounced) is also sent
// to the server so results beyond the first page are reachable.
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
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => setTerm(search), [search]);

  useEffect(() => {
    if (term === search) return;
    const t = setTimeout(() => onSearch(term.trim()), 280);
    return () => clearTimeout(t);
  }, [term, search, onSearch]);

  // Group the loaded rows into roots + their facet children. A facet whose
  // parent isn't in the loaded set degrades gracefully to a top-level row.
  const tree = useMemo<TreeNode[]>(() => {
    const byId = new Map(items.map((i) => [i.id, i]));
    const kids = new Map<string, ResearchSummary[]>();
    const roots: ResearchSummary[] = [];
    for (const it of items) {
      const pid = it.parentId;
      if (pid && byId.has(pid) && pid !== it.id) {
        const arr = kids.get(pid) || [];
        arr.push(it);
        kids.set(pid, arr);
      } else {
        roots.push(it);
      }
    }
    return roots.map((r) => ({ item: r, children: kids.get(r.id) || [] }));
  }, [items]);

  // Instant client filter: keep a root if it OR any of its facets match; when a
  // root matches, keep all its facets, else only the matching ones.
  const q = term.trim().toLowerCase();
  const matches = (it: ResearchSummary) =>
    !q || (it.query || '').toLowerCase().includes(q) || (it.snippet || '').toLowerCase().includes(q);

  const shown = useMemo<TreeNode[]>(() => {
    if (!q) return tree;
    const out: TreeNode[] = [];
    for (const node of tree) {
      const rootHit = matches(node.item);
      const children = rootHit ? node.children : node.children.filter(matches);
      if (rootHit || children.length) out.push({ item: node.item, children });
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tree, q]);

  const shownCount = shown.reduce((n, node) => n + 1 + node.children.length, 0);

  const isOpen = (node: TreeNode) =>
    !!q || // auto-expand while searching so matches are visible
    expanded.has(node.item.id) ||
    node.children.some((c) => c.id === selectedId); // keep open if a facet is selected

  const toggle = (rootId: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(rootId)) next.delete(rootId);
      else next.add(rootId);
      return next;
    });

  const renderRow = (it: ResearchSummary, isChild: boolean) => (
    <button
      key={it.id}
      role="listitem"
      className={'history-item' + (isChild ? ' child' : '') + (it.id === selectedId ? ' active' : '')}
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
  );

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
            {q ? 'No researches match your search.' : 'No researches yet — run your first one.'}
          </div>
        )}

        {!error &&
          shown.map((node) =>
            node.children.length === 0 ? (
              renderRow(node.item, false)
            ) : (
              <div key={node.item.id} className={'tree-node' + (isOpen(node) ? ' open' : '')}>
                <div className="tree-root-row">
                  <button
                    className="tree-toggle"
                    onClick={() => toggle(node.item.id)}
                    aria-expanded={isOpen(node)}
                    aria-label={isOpen(node) ? 'Collapse facets' : 'Expand facets'}
                    title={`${node.children.length} facet${node.children.length === 1 ? '' : 's'}`}
                  >
                    <span aria-hidden>{isOpen(node) ? '▾' : '▸'}</span>
                  </button>
                  <div className="tree-root-main">
                    {renderRow(node.item, false)}
                    <span className="facet-count">
                      {node.children.length} facet{node.children.length === 1 ? '' : 's'}
                    </span>
                  </div>
                </div>
                {isOpen(node) && (
                  <div className="tree-children">{node.children.map((c) => renderRow(c, true))}</div>
                )}
              </div>
            ),
          )}
      </div>

      {!error && (total > shownCount || q) && (
        <div className="history-foot muted">
          {q
            ? `${shownCount} match${shownCount === 1 ? '' : 'es'}${total > items.length ? ` · ${total} total` : ''}`
            : `Showing ${items.length} of ${total}`}
        </div>
      )}
    </aside>
  );
}
