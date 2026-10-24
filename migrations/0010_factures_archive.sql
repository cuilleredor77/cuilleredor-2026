-- Archivage des factures envoyées : date à laquelle le PDF figé a été copié sur le Drive
ALTER TABLE invoices ADD COLUMN archived_on TEXT NOT NULL DEFAULT '';
