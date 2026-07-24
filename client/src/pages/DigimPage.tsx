import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { dina } from '../lib/apiClient';
import { useAsync } from '../hooks/useAsync';
import type { ResearchRecord, ResearchSummary } from '../lib/types';
import { HistorySidebar } from '../digim/HistorySidebar';
import { ResearchDetail } from '../digim/ResearchDetail';
import { RunResearch } from '../digim/RunResearch';

// The DIGIM console page: a history rail (past researches) beside a main area
// that either runs a new research or displays the selected one. The selected
// research lives in the URL (/digim/:researchId) so views are deep-linkable.
export function DigimPage() {
  const { researchId } = useParams();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [historyNonce, setHistoryNonce] = useState(0);

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

  const refreshHistory = () => setHistoryNonce((n) => n + 1);
  const select = (id: string) => navigate(`/digim/${id}`);
  const startNew = () => navigate('/digim');

  const mode = researchId ? 'detail' : 'new';

  return (
    <div className="digim">
      <HistorySidebar
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
