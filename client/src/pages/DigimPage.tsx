import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { dina } from '../lib/apiClient';
import { useAsync } from '../hooks/useAsync';
import type { ResearchRecord, ResearchSummary } from '../lib/types';
import { HistorySidebar } from '../digim/HistorySidebar';
import { ResearchDetail } from '../digim/ResearchDetail';
import { RunResearch } from '../digim/RunResearch';

// The DIGIM console page: a collapsible "Researches" rail (past researches)
// beside a main area that either runs a new research or displays the selected
// one. The selected research lives in the URL (/digim/:researchId) so views are
// deep-linkable. The rail is a slide-over drawer on phones and a
// collapse-to-reclaim-space panel on desktop — controlled by one `railOpen`
// flag, initialised open on wide screens and closed on narrow ones.
function initialRailOpen(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return true;
  return window.matchMedia('(min-width: 1024px)').matches;
}

export function DigimPage() {
  const { researchId } = useParams();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [historyNonce, setHistoryNonce] = useState(0);
  const [railOpen, setRailOpen] = useState<boolean>(initialRailOpen);

  const history = useAsync<{ items: ResearchSummary[]; total: number }>(
    (signal) => dina.history({ limit: 50, search: search || undefined }, signal),
    [search, historyNonce],
  );

  const detail = useAsync<ResearchRecord | null>(
    async (signal) => {
      if (!researchId) return null;
      const res = await dina.getResearch(researchId, true, signal);
      return res.research;
    },
    [researchId],
  );

  // On phones, opening a research from the drawer should reveal it (close the
  // drawer). On desktop the rail stays put.
  const isNarrow = () =>
    typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(max-width: 1023px)').matches;

  const refreshHistory = () => setHistoryNonce((n) => n + 1);
  const select = (id: string) => {
    navigate(`/digim/${id}`);
    if (isNarrow()) setRailOpen(false);
  };
  const startNew = () => {
    navigate('/digim');
    if (isNarrow()) setRailOpen(false);
  };

  // Close the drawer on Escape (mobile affordance).
  useEffect(() => {
    if (!railOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isNarrow()) setRailOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [railOpen]);

  const mode = researchId ? 'detail' : 'new';
  const activeTitle = mode === 'detail' ? detail.data?.query || 'Research' : 'New research';

  return (
    <div className={'digim' + (railOpen ? ' rail-open' : ' rail-closed')}>
      {/* Top bar: rail toggle + context title. Always present so the rail can be
          summoned/dismissed at any width. */}
      <header className="digim-topbar">
        <button
          className="icon-btn"
          onClick={() => setRailOpen((v) => !v)}
          aria-label={railOpen ? 'Hide researches' : 'Show researches'}
          aria-expanded={railOpen}
          aria-controls="researches-rail"
        >
          <span aria-hidden>{railOpen ? '⟨' : '☰'}</span>
        </button>
        <span className="digim-topbar-title" title={activeTitle}>
          {activeTitle}
        </span>
        <button className="btn small primary topbar-new" onClick={startNew}>
          + New
        </button>
      </header>

      {/* Backdrop: only interactive as the drawer scrim on narrow screens. */}
      <div
        className="digim-scrim"
        role="presentation"
        onClick={() => setRailOpen(false)}
        hidden={!railOpen}
      />

      <HistorySidebar
        id="researches-rail"
        items={history.data?.items ?? []}
        total={history.data?.total ?? 0}
        loading={history.loading}
        error={history.error}
        search={search}
        onSearch={setSearch}
        selectedId={researchId ?? null}
        onSelect={select}
        onNew={startNew}
        onRetry={history.refetch}
        onClose={() => setRailOpen(false)}
      />

      <section className="digim-main">
        {mode === 'new' ? (
          <RunResearch
            onComplete={(res) => {
              refreshHistory();
              // Show the finished research immediately (no manual refresh needed).
              if (res.intelligence_id) navigate(`/digim/${res.intelligence_id}`);
            }}
          />
        ) : (
          <ResearchDetail
            id={researchId!}
            record={detail.data ?? null}
            loading={detail.loading}
            error={detail.error}
            onRetry={detail.refetch}
          />
        )}
      </section>
    </div>
  );
}
