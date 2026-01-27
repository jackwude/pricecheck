CREATE TABLE IF NOT EXISTS sync_spaces (
  sid TEXT PRIMARY KEY,
  rev INTEGER NOT NULL,
  blob TEXT,
  updated_at TEXT NOT NULL
);
