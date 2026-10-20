-- Position de la réponse dans le Google Sheet (ex. « gid=0&range=A42 »), pour ouvrir la demande initiale.
ALTER TABLE requests ADD COLUMN sheet_ref TEXT NOT NULL DEFAULT '';
