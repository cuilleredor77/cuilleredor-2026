-- La ligne du Google Sheet est retrouvée au clic par le script de la feuille (le tri des lignes changeait les positions).
ALTER TABLE requests DROP COLUMN sheet_ref;
