"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPool = getPool;
exports.initDb = initDb;
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
let pool = null;
function getPool() {
    if (!pool) {
        const connectionString = process.env.DATABASE_URL;
        if (!connectionString) {
            console.warn("WARNING: DATABASE_URL environment variable is not defined!");
        }
        pool = new pg_1.Pool({
            connectionString,
            ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
            max: 20, // Increased pool size for concurrent request handling
            idleTimeoutMillis: 30000, // Close idle connections after 30s
            connectionTimeoutMillis: 3000, // Fast fail if DB connection cannot be acquired
        });
    }
    return pool;
}
async function initDb() {
    const db = getPool();
    await db.query(`
    CREATE TABLE IF NOT EXISTS releases (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      date TIMESTAMPTZ NOT NULL,
      additional_info TEXT,
      steps_completed INTEGER[] NOT NULL DEFAULT '{}',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    -- Index for optimized release sorting performance
    CREATE INDEX IF NOT EXISTS idx_releases_created_at ON releases (created_at DESC);
  `);
    console.log("Database initialized: 'releases' table & indexes ready.");
}
