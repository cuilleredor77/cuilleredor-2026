-- Signature électronique simple du devis / contrat par le client (preuves en JSON)
ALTER TABLE requests ADD COLUMN signature_json TEXT NOT NULL DEFAULT '';
