-- Avenants : devis tel que signé (référence) et avenants successifs (avant / après)
ALTER TABLE requests ADD COLUMN signed_snapshot TEXT NOT NULL DEFAULT '';
CREATE TABLE IF NOT EXISTS amendments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id INTEGER NOT NULL,
  number INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  reason TEXT NOT NULL DEFAULT '',
  before_json TEXT NOT NULL,
  after_json TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_amendments_request ON amendments(request_id, number);
