/**
 * Redis helpers using Upstash Redis (HTTP-based, works in serverless)
 * Falls back to in-memory store for local development
 */

const isUpstash =
  process.env.UPSTASH_REDIS_REST_URL &&
  !process.env.UPSTASH_REDIS_REST_URL.includes('localhost');

// In-memory fallback for local dev
const mem = new Map<string, { value: unknown; expiresAt?: number }>();

function memGet(key: string): unknown | null {
  const e = mem.get(key);
  if (!e) return null;
  if (e.expiresAt && Date.now() > e.expiresAt) { mem.delete(key); return null; }
  return e.value;
}
function memSet(key: string, value: unknown, ttl?: number) {
  mem.set(key, { value, expiresAt: ttl ? Date.now() + ttl * 1000 : undefined });
}
function memDel(key: string) { mem.delete(key); }
function memIncr(key: string): number {
  const e = mem.get(key);
  const n = (typeof e?.value === 'number' ? e.value : 0) + 1;
  mem.set(key, { value: n, expiresAt: e?.expiresAt });
  return n;
}

async function upstashRequest(command: unknown[]) {
  const url = process.env.UPSTASH_REDIS_REST_URL!;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN!;
  const res = await fetch(`${url}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
  });
  const json = await res.json();
  return json.result;
}

export function getRoomCacheKey(code: string) { return `room:${code}:state`; }

export async function getRoomStateFromCache(code: string): Promise<unknown | null> {
  try {
    const key = getRoomCacheKey(code);
    if (isUpstash) {
      const result = await upstashRequest(['GET', key]);
      return result ? JSON.parse(result) : null;
    }
    return memGet(key);
  } catch { return null; }
}

export async function setRoomStateInCache(code: string, state: unknown): Promise<void> {
  try {
    const key = getRoomCacheKey(code);
    if (isUpstash) {
      await upstashRequest(['SET', key, JSON.stringify(state), 'EX', 2]);
    } else {
      memSet(key, state, 2);
    }
  } catch (e) { console.error('Redis set error:', e); }
}

export async function invalidateRoomCache(code: string): Promise<void> {
  try {
    const key = getRoomCacheKey(code);
    if (isUpstash) {
      await upstashRequest(['DEL', key]);
    } else {
      memDel(key);
    }
  } catch (e) { console.error('Redis del error:', e); }
}

export async function incrementTabSwitch(sessionId: string): Promise<number> {
  try {
    const key = `session:${sessionId}:tabswitches`;
    if (isUpstash) {
      const count = await upstashRequest(['INCR', key]);
      await upstashRequest(['EXPIRE', key, 86400]);
      return count;
    }
    return memIncr(key);
  } catch { return 0; }
}
