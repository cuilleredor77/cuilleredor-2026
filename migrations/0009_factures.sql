-- Factures : numérotation continue FAC-AAAA-NNN (la numérotation 2026 reprend après FAC-2026-021, émise hors de l'outil)
CREATE TABLE IF NOT EXISTS invoices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id INTEGER NOT NULL,
  number TEXT NOT NULL UNIQUE,
  seq INTEGER NOT NULL,
  year INTEGER NOT NULL,
  kind TEXT NOT NULL,
  issued_on TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'brouillon',
  sent_on TEXT NOT NULL DEFAULT '',
  paid_on TEXT NOT NULL DEFAULT '',
  ref_number TEXT NOT NULL DEFAULT '',
  data_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_invoices_request ON invoices(request_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_seq ON invoices(year, seq);
