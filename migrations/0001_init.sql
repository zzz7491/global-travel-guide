-- =============================================================================
-- Global Travel Guide — D1 schema (migration 0001)
-- =============================================================================
-- This schema is a 1:1 mirror of the JSON content model in /data so that
-- migrating from "build-time JSON" to "request-time D1" requires NO change to
-- the render layer (src/lib/content.js + src/templates/render.js). Each JSON
-- file type becomes a table; nested arrays (blocks / sections / related) are
-- stored as JSON text and rehydrated by the Worker before passing to the
-- shared render functions. See ARCHITECTURE.md for the migration steps.
-- =============================================================================

-- 国家 / Country ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS countries (
  id           TEXT PRIMARY KEY,   -- matches JSON "id"
  type         TEXT NOT NULL DEFAULT 'country',
  country      TEXT NOT NULL,      -- URL segment, e.g. "china"
  name         TEXT,               -- 中文名 "中国"
  name_en      TEXT,
  title        TEXT,
  description  TEXT,
  keywords     TEXT,
  h1           TEXT,
  lead         TEXT,
  sections_json TEXT,              -- JSON: [{title, items:[{title,desc,url}]}]
  created_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);

-- 城市 / City ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cities (
  id           TEXT PRIMARY KEY,
  type         TEXT NOT NULL DEFAULT 'city',
  country      TEXT NOT NULL,
  city         TEXT NOT NULL,       -- URL segment, e.g. "beijing"
  name         TEXT,
  name_en      TEXT,
  title        TEXT,
  description  TEXT,
  keywords     TEXT,
  h1           TEXT,
  lead         TEXT,
  related_json TEXT,               -- JSON: ["china-beijing-gugong", ...]
  image        TEXT,               -- R2 key (without extension)
  created_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);

-- 景点 / Attraction ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS attractions (
  id           TEXT PRIMARY KEY,
  type         TEXT NOT NULL DEFAULT 'attraction',
  country      TEXT NOT NULL,
  city         TEXT NOT NULL,
  slug         TEXT NOT NULL,       -- URL segment, e.g. "gugong"
  title        TEXT,
  description  TEXT,
  keywords     TEXT,
  h1           TEXT,
  lead         TEXT,
  blocks_json  TEXT,               -- JSON: [{kind, title, html|items|refs}]
  image        TEXT,
  social_image TEXT,
  created_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);

-- 路线 / Route --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS routes (
  id           TEXT PRIMARY KEY,
  type         TEXT NOT NULL DEFAULT 'route',
  country      TEXT NOT NULL,
  city         TEXT NOT NULL,
  slug         TEXT NOT NULL,
  title        TEXT,
  description  TEXT,
  keywords     TEXT,
  h1           TEXT,
  lead         TEXT,
  blocks_json  TEXT,
  image        TEXT,
  social_image TEXT,
  created_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);

-- 攻略 / Guide --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS guides (
  id           TEXT PRIMARY KEY,
  type         TEXT NOT NULL DEFAULT 'guide',
  country      TEXT NOT NULL,
  city         TEXT NOT NULL,
  slug         TEXT NOT NULL,
  title        TEXT,
  description  TEXT,
  keywords     TEXT,
  h1           TEXT,
  lead         TEXT,
  blocks_json  TEXT,
  image        TEXT,
  social_image TEXT,
  created_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);

-- 最佳旅行时间 / Best-time ---------------------------------------------------
CREATE TABLE IF NOT EXISTS best_times (
  id           TEXT PRIMARY KEY,
  type         TEXT NOT NULL DEFAULT 'best-time',
  country      TEXT NOT NULL,
  city         TEXT NOT NULL,
  title        TEXT,
  description  TEXT,
  keywords     TEXT,
  h1           TEXT,
  lead         TEXT,
  blocks_json  TEXT,
  image        TEXT,
  social_image TEXT,
  created_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);

-- Indexes that mirror the data-model queries (by country/city, by slug). -----
CREATE INDEX IF NOT EXISTS idx_cities_country      ON cities      (country);
CREATE INDEX IF NOT EXISTS idx_attractions_cc      ON attractions (country, city);
CREATE INDEX IF NOT EXISTS idx_routes_cc           ON routes      (country, city);
CREATE INDEX IF NOT EXISTS idx_guides_cc           ON guides      (country, city);
CREATE INDEX IF NOT EXISTS idx_best_times_cc       ON best_times  (country, city);
CREATE INDEX IF NOT EXISTS idx_attractions_slug    ON attractions (country, city, slug);
CREATE INDEX IF NOT EXISTS idx_routes_slug         ON routes      (country, city, slug);
CREATE INDEX IF NOT EXISTS idx_guides_slug         ON guides      (country, city, slug);
