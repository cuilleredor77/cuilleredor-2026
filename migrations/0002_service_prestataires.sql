-- Type de prestation (avec service / livraison / à emporter), wedding planner et prestataires déjà trouvés
ALTER TABLE requests ADD COLUMN service_mode TEXT NOT NULL DEFAULT 'service';
ALTER TABLE requests ADD COLUMN wedding_planner TEXT NOT NULL DEFAULT '';
ALTER TABLE requests ADD COLUMN vendors_found TEXT NOT NULL DEFAULT '';
