import { useRef, useState } from 'react';
import { dina, ApiError } from '../lib/apiClient';
import type { IntelligenceLevel, ResearchRunResult } from '../lib/types';

interface Props {
  onComplete: (result: ResearchRunResult) => void;
}

type Mode = 'research' | 'investigate';

// The "new research" panel. Runs a (long) research or investigate with an
// abortable request, explicit busy/error/result states, and a Cancel that
// actually cancels the in-flight call. On success it hands the result up so the
// history rail can refresh.
export function RunResearch({ onComplete }: Props) {
  const [query, setQuery] = useState('');
  const [level, setLevel] = useState<IntelligenceLevel>('deep');
  const [mode, setMode] = useState<Mode>('research');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ResearchRunResult | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const canRun = query.trim().length > 2 && !busy;

  const run = async () => {
    if (!canRun) return;
    setBusy(true);
    setError(null);
    setResult(null);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const body = { query: query.trim(), intelligence_level: level };
      const res =
        mode === 'investigate'
          ? await dina.investigate(body, ctrl.signal)
          : await dina.research({ ...body, graph: true }, ctrl.signal);
      setResult(res);
      onComplete(res);
    } catch (err) {
      if (err instanceof ApiError && err.isTimeout) setError('The request was cancelled or timed out.');
      else setError(err instanceof Error ? err.message : 'Research failed.');
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  };

  const cancel = () => abortRef.current?.abort();

  const answer = result?.answer || result?.summary || '';
  const sources = Array.isArray(result?.sources) ? (result!.sources as string[]) : [];

  return (
    <div className="run">
      <header className="page-head">
        <h1>New research</h1>
        <p className="muted">
          Gather the open web and synthesize a grounded briefing. <strong>Investigate</strong> runs a deeper,
          multi-facet pass.
        </p>
      </header>

      <div className="run-form">
        <textarea
          className="run-query"
          placeholder="What should DINA research? e.g. the 2026 Iran–USA war: causes, timeline, oil effects"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) run();
          }}
          rows={3}
          disabled={busy}
        />
        <div className="run-controls">
          <label className="field">
            <span>Mode</span>
            <select value={mode} onChange={(e) => setMode(e.target.value as Mode)} disabled={busy}>
              <option value="research">Research</option>
              <option value="investigate">Investigate (multi-facet)</option>
            </select>
          </label>
          <label className="field">
            <span>Depth</span>
            <select value={level} onChange={(e) => setLevel(e.target.value as IntelligenceLevel)} disabled={busy}>
              <option value="surface">Surface</option>
              <option value="deep">Deep</option>
              <option value="predictive">Predictive</option>
            </select>
          </label>
          <div className="run-actions">
            {busy ? (
              <button className="btn" onClick={cancel}>
                Cancel
              </button>
            ) : (
              <button className="btn primary" onClick={run} disabled={!canRun}>
                Run
              </button>
            )}
          </div>
        </div>
        <p className="run-hint muted">⌘/Ctrl + Enter to run. Deep passes can take a minute or more.</p>
      </div>

      {busy && (
        <div className="panel run-busy" role="status">
          <span className="spinner" aria-hidden /> Researching “{query.trim()}”… this can take a while.
        </div>
      )}

      {error && (
        <div className="panel error-panel" role="alert">
          {error}
        </div>
      )}

      {answer && (
        <div className="panel run-result">
          <h2>Result</h2>
          <p className="research-summary">{answer}</p>
          {sources.length > 0 && (
            <div className="sources compact">
              {sources.slice(0, 12).map((u, i) => (
                <a key={i} className="source" href={u} target="_blank" rel="noopener noreferrer">
                  {(() => {
                    try {
                      return new URL(u).hostname.replace(/^www\./, '');
                    } catch {
                      return u;
                    }
                  })()}
                </a>
              ))}
            </div>
          )}
          <p className="muted">Saved to your history on the left.</p>
        </div>
      )}
    </div>
  );
}
