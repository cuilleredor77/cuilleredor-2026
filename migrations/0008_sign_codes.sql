-- Codes de vérification envoyés par e-mail avant la signature en ligne (un code actif par demande)
CREATE TABLE IF NOT EXISTS sign_codes (
  request_id INTEGER PRIMARY KEY,
  code_hash TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0
);
