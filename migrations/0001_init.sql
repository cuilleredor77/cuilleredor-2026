-- Demandes de devis (une ligne par demande ; le devis est stocké en JSON dans la même ligne)
CREATE TABLE IF NOT EXISTS requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'nouvelle',
  source TEXT NOT NULL DEFAULT 'site',
  client_name TEXT NOT NULL DEFAULT '',
  client_email TEXT NOT NULL DEFAULT '',
  client_phone TEXT NOT NULL DEFAULT '',
  billing_address TEXT NOT NULL DEFAULT '',
  event_type TEXT NOT NULL DEFAULT 'Mariage',
  event_date TEXT NOT NULL DEFAULT '',
  event_place TEXT NOT NULL DEFAULT '',
  formula TEXT NOT NULL DEFAULT 'buffet',
  adults INTEGER NOT NULL DEFAULT 0,
  children INTEGER NOT NULL DEFAULT 0,
  providers INTEGER NOT NULL DEFAULT 0,
  honor_wine INTEGER NOT NULL DEFAULT 1,
  km REAL,
  budget TEXT NOT NULL DEFAULT '',
  estimate_json TEXT NOT NULL DEFAULT '',
  selection_text TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL DEFAULT '',
  quote_json TEXT NOT NULL DEFAULT '',
  quote_version INTEGER NOT NULL DEFAULT 0,
  sent_at TEXT,
  internal_notes TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_event_date ON requests(event_date);
