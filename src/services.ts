import { getPool } from "./db";
import { TOTAL_STEPS, computeStatus } from "./constants";
import { Release, CreateReleaseInput, UpdateReleaseInput } from "./types";

function rowToRelease(row: Record<string, unknown>): Release {
  const stepsCompleted = (row.steps_completed as number[]) ?? [];
  return {
    id: row.id as string,
    name: row.name as string,
    date: (row.date as Date).toISOString(),
    status: computeStatus(stepsCompleted),
    additionalInfo: (row.additional_info as string) ?? null,
    stepsCompleted,
    createdAt: (row.created_at as Date).toISOString(),
    updatedAt: (row.updated_at as Date).toISOString(),
  };
}

// In-memory query cache with TTL & instant mutation invalidation
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

let releasesCache: CacheEntry<Release[]> | null = null;
const CACHE_TTL_MS = 5000; // 5 seconds TTL for rapid concurrent reads

export function invalidateCache(): void {
  releasesCache = null;
}

export async function getReleases(): Promise<Release[]> {
  const now = Date.now();
  if (releasesCache && now - releasesCache.timestamp < CACHE_TTL_MS) {
    return releasesCache.data;
  }

  const db = getPool();
  // Prepared statement for query plan optimization inside PostgreSQL
  const { rows } = await db.query({
    name: "fetch-all-releases",
    text: "SELECT * FROM releases ORDER BY created_at DESC",
  });
  const result = rows.map(rowToRelease);
  releasesCache = { data: result, timestamp: now };
  return result;
}

export async function getReleaseById(id: string): Promise<Release | null> {
  // Check in-memory cache first if available
  if (releasesCache) {
    const cached = releasesCache.data.find((r) => r.id === id);
    if (cached) return cached;
  }

  const db = getPool();
  const { rows } = await db.query({
    name: "fetch-release-by-id",
    text: "SELECT * FROM releases WHERE id = $1",
    values: [id],
  });
  if (rows.length === 0) return null;
  return rowToRelease(rows[0]);
}

export async function createRelease(input: CreateReleaseInput): Promise<Release> {
  invalidateCache();
  const db = getPool();
  const { rows } = await db.query(
    `INSERT INTO releases (name, date, additional_info, steps_completed)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [input.name, input.date, input.additionalInfo ?? null, []]
  );
  return rowToRelease(rows[0]);
}

export async function updateRelease(input: UpdateReleaseInput): Promise<Release | null> {
  invalidateCache();
  const db = getPool();

  const validSteps = input.stepsCompleted
    ? [...new Set(input.stepsCompleted.filter((s) => s >= 0 && s < TOTAL_STEPS))]
    : undefined;

  const { rows } = await db.query(
    `UPDATE releases
     SET additional_info = COALESCE($2, additional_info),
         steps_completed = COALESCE($3, steps_completed),
         updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [
      input.id,
      input.additionalInfo !== undefined ? input.additionalInfo : null,
      validSteps ? `{${validSteps.join(",")}}` : null,
    ]
  );
  if (rows.length === 0) return null;
  return rowToRelease(rows[0]);
}

export async function deleteRelease(id: string): Promise<boolean> {
  invalidateCache();
  const db = getPool();
  const { rowCount } = await db.query("DELETE FROM releases WHERE id = $1", [id]);
  return (rowCount ?? 0) > 0;
}
