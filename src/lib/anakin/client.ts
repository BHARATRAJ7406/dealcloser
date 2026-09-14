/**
 * Anakin Wire API Client
 * All requests stay server-side. The API key is never exposed to the browser.
 */

const ANAKIN_BASE_URL = process.env.ANAKIN_BASE_URL ?? 'https://api.anakin.io';
const ANAKIN_API_KEY = process.env.ANAKIN_API_KEY ?? '';

if (!ANAKIN_API_KEY && typeof window === 'undefined') {
  console.warn('[AnakinClient] ANAKIN_API_KEY is not set');
}

export class AnakinError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly code?: string,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = 'AnakinError';
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  timeoutMs = 30_000,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const url = `${ANAKIN_BASE_URL}${path}`;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${ANAKIN_API_KEY}`,
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };

  // Safety: strip key from any accidental logging
  const safeHeaders = { ...headers };
  delete safeHeaders['Authorization'];
  console.log(`[Anakin] ${options.method ?? 'GET'} ${path}`);

  try {
    const res = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timer);

    const text = await res.text();
    let body: unknown;
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }

    if (!res.ok) {
      const errBody = body as { error?: { code?: string; message?: string } };
      throw new AnakinError(
        errBody?.error?.message ?? `HTTP ${res.status}`,
        res.status,
        errBody?.error?.code,
        body,
      );
    }

    return body as T;
  } catch (err) {
    clearTimeout(timer);
    if (err instanceof AnakinError) throw err;
    if ((err as Error).name === 'AbortError') {
      throw new AnakinError('Request timed out', 408, 'TIMEOUT');
    }
    throw new AnakinError((err as Error).message, 0, 'NETWORK_ERROR');
  }
}

// ─── Wire Catalog ────────────────────────────────────────────────────────────

export interface CatalogEntry {
  id: string;
  slug: string;
  name: string;
  url: string;
  domain: string;
  category: string;
  description: string;
  auth_required: boolean;
  auth_types: string[];
  status: string;
  action_count: number;
  created_at: string;
  updated_at: string;
}

export interface WireAction {
  id: string;
  action_id: string;
  catalog_id: string;
  name: string;
  description: string;
  tags: string[];
  type: 'read' | 'write';
  mode: 'async' | 'sync';
  auth_mode: string;
  auth_required: boolean;
  parameters: WireActionParam[];
  credits_per_call: number;
  premium: boolean;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface WireActionParam {
  name: string;
  type: string;
  default?: unknown;
  required: boolean;
  description: string;
}

export async function getCatalog(): Promise<CatalogEntry[]> {
  const data = await request<{ catalog: CatalogEntry[] }>(
    '/v1/wire/catalog?limit=500',
  );
  return data.catalog ?? [];
}

export async function getCatalogEntry(
  slug: string,
): Promise<{ catalog: CatalogEntry; actions: WireAction[] }> {
  return request(`/v1/wire/catalog/${slug}`);
}

// ─── Wire Resolve ────────────────────────────────────────────────────────────

export interface ResolveResult {
  action_id: string;
  catalog_slug: string;
  catalog_name: string;
  score: number;
  reason: string;
}

export async function resolveAction(query: string): Promise<ResolveResult[]> {
  return request(`/v1/wire/resolve?q=${encodeURIComponent(query)}`);
}

// ─── Wire Task ───────────────────────────────────────────────────────────────

export interface WireTaskRequest {
  action_id: string;
  parameters: Record<string, unknown>;
  credential_id?: string;
}

export interface WireJob {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: unknown;
  error?: { code: string; message: string };
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export async function createTask(req: WireTaskRequest): Promise<{ job_id: string }> {
  return request('/v1/wire/task', {
    method: 'POST',
    body: JSON.stringify(req),
  });
}

export async function getJob(jobId: string): Promise<WireJob> {
  return request(`/v1/wire/jobs/${jobId}`);
}

export async function pollJob(
  jobId: string,
  opts: { intervalMs?: number; maxWaitMs?: number } = {},
): Promise<WireJob> {
  const { intervalMs = 1500, maxWaitMs = 60_000 } = opts;
  const deadline = Date.now() + maxWaitMs;

  while (Date.now() < deadline) {
    const job = await getJob(jobId);
    if (job.status === 'completed') return job;
    if (job.status === 'failed') {
      throw new AnakinError(
        job.error?.message ?? 'Job failed',
        500,
        job.error?.code ?? 'JOB_FAILED',
        job,
      );
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }

  throw new AnakinError('Job polling timed out', 408, 'POLL_TIMEOUT');
}

/**
 * Execute a Wire task end-to-end: POST task → poll until done → return result.
 */
export async function runWireAction<T = unknown>(
  req: WireTaskRequest,
  pollOpts?: { intervalMs?: number; maxWaitMs?: number },
): Promise<{ job: WireJob; result: T }> {
  const { job_id } = await createTask(req);
  const job = await pollJob(job_id, pollOpts);
  return { job, result: job.result as T };
}

// ─── Wire Identities ─────────────────────────────────────────────────────────

export interface WireIdentity {
  id: string;
  credential_id: string;
  catalog_slug: string;
  catalog_name: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export async function getIdentities(): Promise<WireIdentity[]> {
  const data = await request<{ identities: WireIdentity[] }>(
    '/v1/wire/identities',
  );
  return data.identities ?? [];
}
