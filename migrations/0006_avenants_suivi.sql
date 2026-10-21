-- Suivi des avenants : date d’envoi au client et date de signature
ALTER TABLE amendments ADD COLUMN sent_on TEXT NOT NULL DEFAULT '';
ALTER TABLE amendments ADD COLUMN signed_on TEXT NOT NULL DEFAULT '';
