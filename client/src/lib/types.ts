// ============================================================================
// DINA API — shared response types (mirror of docs/digim/API.md on the server)
// ============================================================================
// Kept deliberately close to the server contract so the client is a faithful,
// typed view of the DUMP-compliant API. Optional fields reflect that the server
// may omit them depending on the capability/level.

export interface ResearchSummary {
  id: string;
  query: string;
  level: string;
  confidence: number;
  model: string;
  processingTimeMs: number;
  generatedAt: string | null;
  expiresAt: string | null;
  sourceCount: number;
  snippet: string;
}

export interface ResearchDocument {
  id: string;
  title: string;
  url: string;
  snippet: string;
  provider: string;
}

export interface ResearchRecord extends ResearchSummary {
  summary: string;
  keyInsights: string[];
  trends: string[];
  entities: Array<{ text: string; type?: string }>;
  topics: Array<{ topic: string; relevance?: number }>;
  caveats: string[];
  sources: string[];
  sourceContentIds: string[];
  documents?: ResearchDocument[];
}

export interface HistoryPage {
  total: number;
  count: number;
  offset: number;
  items: ResearchSummary[];
}

export interface GraphNode {
  id: string;
  name: string;
  type: string;
  occurred_at: string | null;
  weight: number;
}
export interface GraphEdge {
  from: string;
  predicate: string;
  to: string;
  corroboration: number;
  confidence: number | null;
  occurred_at: string | null;
  sources: string[];
}
export interface GraphResult {
  focus: string;
  matched_focus: boolean;
  suggested_view: 'network' | 'temporal' | 'semantic';
  node_count: number;
  edge_count: number;
  nodes: GraphNode[];
  edges: GraphEdge[];
  graph_totals?: { entities: number; relationships: number };
}

export interface SemanticPoint {
  id: string;
  label: string;
  url: string;
  provider: string;
  x: number;
  y: number;
  z: number;
}
export interface SemanticResult {
  dimensions: number;
  point_count: number;
  explained_variance: number[];
  points: SemanticPoint[];
}

export interface NodeInsight {
  entity: string;
  insight: string;
  relationships: string[];
  sources: string[];
  cached: boolean;
}

export interface ResearchRunResult {
  answer?: string;
  summary?: string;
  basis?: string;
  sources?: string[];
  entities?: Array<{ text: string; type?: string }>;
  confidence?: number;
  graph_relationships_added?: number;
  [k: string]: unknown;
}

export type IntelligenceLevel = 'surface' | 'deep' | 'predictive';
