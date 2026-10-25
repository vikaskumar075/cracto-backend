"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.invalidateCache = invalidateCache;
exports.getReleases = getReleases;
exports.getReleaseById = getReleaseById;
exports.createRelease = createRelease;
exports.updateRelease = updateRelease;
exports.deleteRelease = deleteRelease;
const db_1 = require("./db");
const constants_1 = require("./constants");
function rowToRelease(row) {
    const stepsCompleted = row.steps_completed ?? [];
    return {
        id: row.id,
        name: row.name,
        date: row.date.toISOString(),
        status: (0, constants_1.computeStatus)(stepsCompleted),
        additionalInfo: row.additional_info ?? null,
        stepsCompleted,
        createdAt: row.created_at.toISOString(),
        updatedAt: row.updated_at.toISOString(),
    };
}
let releasesCache = null;
const CACHE_TTL_MS = 5000; // 5 seconds TTL for rapid concurrent reads
function invalidateCache() {
    releasesCache = null;
}
async function getReleases() {
    const now = Date.now();
    if (releasesCache && now - releasesCache.timestamp < CACHE_TTL_MS) {
        return releasesCache.data;
    }
    const db = (0, db_1.getPool)();
    // Prepared statement for query plan optimization inside PostgreSQL
    const { rows } = await db.query({
        name: "fetch-all-releases",
        text: "SELECT * FROM releases ORDER BY created_at DESC",
    });
    const result = rows.map(rowToRelease);
    releasesCache = { data: result, timestamp: now };
    return result;
}
async function getReleaseById(id) {
    // Check in-memory cache first if available
    if (releasesCache) {
        const cached = releasesCache.data.find((r) => r.id === id);
        if (cached)
            return cached;
    }
    const db = (0, db_1.getPool)();
    const { rows } = await db.query({
        name: "fetch-release-by-id",
        text: "SELECT * FROM releases WHERE id = $1",
        values: [id],
    });
    if (rows.length === 0)
        return null;
    return rowToRelease(rows[0]);
}
async function createRelease(input) {
    invalidateCache();
    const db = (0, db_1.getPool)();
    const { rows } = await db.query(`INSERT INTO releases (name, date, additional_info, steps_completed)
     VALUES ($1, $2, $3, $4)
     RETURNING *`, [input.name, input.date, input.additionalInfo ?? null, []]);
    return rowToRelease(rows[0]);
}
async function updateRelease(input) {
    invalidateCache();
    const db = (0, db_1.getPool)();
    const validSteps = input.stepsCompleted
        ? [...new Set(input.stepsCompleted.filter((s) => s >= 0 && s < constants_1.TOTAL_STEPS))]
        : undefined;
    const { rows } = await db.query(`UPDATE releases
     SET additional_info = COALESCE($2, additional_info),
         steps_completed = COALESCE($3, steps_completed),
         updated_at = NOW()
     WHERE id = $1
     RETURNING *`, [
        input.id,
        input.additionalInfo !== undefined ? input.additionalInfo : null,
        validSteps ? `{${validSteps.join(",")}}` : null,
    ]);
    if (rows.length === 0)
        return null;
    return rowToRelease(rows[0]);
}
async function deleteRelease(id) {
    invalidateCache();
    const db = (0, db_1.getPool)();
    const { rowCount } = await db.query("DELETE FROM releases WHERE id = $1", [id]);
    return (rowCount ?? 0) > 0;
}
