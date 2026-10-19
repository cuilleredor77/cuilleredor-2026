# Reprise du chantier « Devis automatique » (étape 1)

Dernière mise à jour : 19/10/2026. Branche de travail : `feat/devis-auto` (dossier dédié
`.claude/worktrees/devis-auto` ; l'ancien dossier `cuillere-dor-catalogue-2026-c181b7` a été repris par une autre session sur `fix/catalogue-textes`). Base : `origin/main` = `claude/site-review-097a64`.

## Objectif
Huguette sort complètement de la boucle des devis (décision du 19/10/2026) : elle n'intervient qu'à la signature
ou pour closer. Chaîne : demande sur le site → km + devis calculés automatiquement → e-mail « Devis prêt » à la
relectrice (`REVIEW_EMAIL`) avec un bouton « Envoyer au client » → e-mail au client (copie cachée à la relectrice).
Étapes suivantes : (2) signature électronique gratuite sur la page du devis (prévenir Huguette à la signature),
(3) acompte (virement + QR, option carte), relances, lien avec le fichier de suivi.

## État au 19/10/2026 (soir)
EN LIGNE sur cuilleredor.fr et fusionné dans `main` (46e0fe5) : formulaire natif, chaîne automatique (Resend,
expéditeur contact@cuilleredor.fr, relecture + réponses sur cuilleredor4@gmail.com), espace /admin (mot de passe
choisi par l'utilisatrice), migrations D1 0001 + 0002 appliquées en production, liseuse intégrée (public/liseuse,
surimpression au clic), parcours simplifié en 3 étapes. Reste : test réel de bout en bout (aucune demande en
production à ce jour), étapes 2 (signature) et 3 (acompte).

## Ce qui est fait
- `lib/quote.ts` : moteur de devis (tarifs catalogue, paliers 30/200/350, vin d'honneur +5 €, enfants 25 €,
  prestataires 30 €, déchets 50 €, km 1,90 €, acompte 30 %, solde J-2 mois reporté au lundi si week-end,
  règlement intégral si événement < 60 jours, caution 250 €, nom de fichier `CDO_AAAAMMJJ_Type_NOM_Prénom_Devis_Contrat`).
  Vérifié : exemple du catalogue 180+15+5 en buffet = 7 725 € ; échéance du solde identique à un vrai devis.
- `lib/server.ts` : accès D1 (binding `DB`) + session admin (cookie signé HMAC, mot de passe `ADMIN_PASSWORD`).
- API : `app/api/demande` (publique, anti-robots), `app/api/admin/login`, `.../requests`, `.../requests/[id]`
  (GET/PUT, régénération, « marquer envoyé »), `.../distance` (Nominatim + OSRM, km aller-retour).
- Pages : `app/admin` (liste, filtres, nouvelle demande manuelle), `app/admin/[id]` (éditeur : demande, lignes
  éditables + options du catalogue, totaux, alertes, e-mail prêt pour Gmail), `app/devis/[token]` (devis +
  services complémentaires + contrat imprimables en PDF, texte du contrat repris du modèle d'Huguette).
- Base : `migrations/0001_init.sql`, `wrangler.jsonc` (binding D1 `DB`, base `cuilleredor-devis`,
  id `c25c78ae-40f0-4d51-9881-0d9738dad1d8`, créée sur le compte Cloudflare, migration appliquée en LOCAL seulement).
- Formulaire de demande natif (`app/quote-chooser.tsx`, styles `.native-form*` en fin de `app/globals.css`) :
  poste sur `/api/demande`, pré-rempli par l'estimation du simulateur (formule, convives, vin d'honneur), champ
  « plats choisis » à coller depuis le catalogue, champ piège anti-robots ; formulaire Google conservé en secours
  (bouton en cas d'échec + lien sous le formulaire). Testé en local (envoi, ligne en D1, mobile 375 px sans défilement).
- `public/robots.txt` : `/admin`, `/devis/`, `/api/`, `/envoyer/` interdits.
- Chaîne automatique (`lib/automation.ts`, `lib/geo.ts`) : `/api/demande` calcule les km (Nominatim + OSRM, nouvel
  essai avec la commune seule si l'adresse est inconnue), génère le devis (statut `devis_pret`) et envoie l'e-mail
  « Devis prêt / À vérifier » (points d'alerte : date < 60 j, sous le minimum, km introuvables, Chef, etc. + rappel
  de vérifier que la date est libre). Bouton « Envoyer au client » = page `/envoyer/[token]?k=…` (clé HMAC liée à
  `ADMIN_PASSWORD`, envoi seulement par un formulaire POST, donc un aperçu du lien n'envoie rien). L'éditeur `/admin/[id]`
  a aussi « Envoyer au client maintenant » (Gmail gardé en secours). Envoi via Resend (`RESEND_API_KEY`) ;
  `RESEND_API_KEY=log` dans `.dev.vars` affiche les e-mails dans la console au lieu de les envoyer.
  Testé en local : demande → e-mail relectrice → envoi client → statut « envoyé » ; mauvaise clé refusée (403/404).

## Reste à faire (dans l'ordre)
1. ~~Formulaire natif~~, 2. ~~robots.txt~~, ~~notification + envoi en 1 clic~~ : faits le 19/10/2026.
3. Déploiement : migration D1 `--remote` FAITE le 19/10/2026. Reste, dans l'ordre :
   a. Compte Resend (l'utilisatrice le crée), domaine `cuilleredor.fr` vérifié (enregistrements DNS donnés par Resend),
      clé API : `npx wrangler secret put RESEND_API_KEY`.
   b. FAIT : `wrangler.jsonc` → `MAIL_FROM` = contact@cuilleredor.fr (pas de nouvelle boîte), `REVIEW_EMAIL` =
      cuilleredor4@gmail.com ; les réponses des clients vont aussi sur cuilleredor4@gmail.com (Reply-To).
   c. Mot de passe de l'espace privé (choisi par l'utilisatrice, 8 caractères min.) : `npx wrangler secret put ADMIN_PASSWORD`.
   d. `npm run deploy` (met en ligne le nouveau formulaire : à faire seulement après a, b, c).
4. Test de bout en bout en production avec une fausse demande (puis suppression).
5. Étape 2 : signature électronique « simple » (lien unique, code reçu par e-mail, horodatage, empreinte SHA-256,
   PDF signé avec page de preuve, classement Drive). Étape 3 : acompte (IBAN + nom exact du titulaire + QR de
   virement EPC, option carte/PayPal), relances automatiques, synchronisation avec le suivi.
6. Calcul des km : « Château de Beauclair, Morville-en-Beauce » trouvé via la commune (122,9 km AR). Si rien n'est
   trouvé, le devis part sans ligne de déplacement et l'e-mail de relecture le signale.

## Points à faire valider par Huguette (texte juridique et tarifs, ne pas changer sans accord)
- Contrat art. 4.4 : « nombre de convives confirmé 30 jours avant » alors que le catalogue dit « figé à J-60 ».
- Page « Services complémentaires » : alignée sur le catalogue (enfants 25 €, prestataires 30 €, soft 5 €, km 1,90 €),
  les anciens devis disaient 20 €, 20 €, 3,80 €, 1,70 €.
- Mention « TVA non applicable (art. 293 B du CGI) » : à confirmer (texte coupé dans le modèle d'origine).
- Report du solde au lundi si le jour tombe un week-end (déduit d'un devis réel) : à confirmer.
- E-mail type (gabarit dans l'éditeur) : à relire dans son ton habituel.

## Autres chantiers ouverts (hors devis)
- Catalogue (déjà en ligne) : liste P1/P2 d'un audit externe collée dans la conversation : état « coché » plus visible
  + compteur de plats, textes mobiles trop petits (7 px), boutons 44 px, renommer le bouton « PDF & ma sélection »,
  textes FR (déplacement, « Ou vin d'honneur seul », avocat surprise, « Mes cocktails »), version anglaise
  (« canapé reception », « covers » → « guests »…), balises de partage (og:image), `loading="lazy"`.
  Déjà fait : e-mail de sélection avec date/lieu/formule/convives, tous les plats pris en compte, sélection mémorisée, PDF 26 pages.
- À tester sur de vrais iPhone/Android : « Envoyer ma sélection » (mailto) et « Ma sélection » (impression PDF).

## Mode d'emploi technique
- Site principal : `npm run deploy` (build + wrangler) depuis ce dossier, après `npm ci`. Catalogue : sources dans
  `catalogue-source/`, `python3 build_site.py` génère `catalogue-site/`, puis
  `npx wrangler pages deploy <chemin>/catalogue-site --project-name catalogue-cuilleredor --branch main --commit-dirty=true`
  (lancer depuis `/tmp`). Artefacts Claude FR/EN : https://claude.ai/artifact/7Svcusx6cgYRwdVpikFyGk et
  https://claude.ai/artifact/EfKpP4WChMrtD2dzP9H65E (version sans menu PDF).
- Test local de l'espace privé : `.dev.vars` contient `ADMIN_PASSWORD=test-local-2026` (fichier ignoré par Git),
  `npx wrangler d1 migrations apply cuilleredor-devis --local`, `npm run build`, `npx wrangler dev --port 8787`.
  (`npm run dev` avec simulation Cloudflare ne charge pas les composants clients.)
- Le chemin du dossier contient un « è » décomposé (NFD) : l'outil d'écriture de fichiers de l'éditeur le refuse ;
  écrire via le terminal. Nettoyer les fichiers `._*` créés par le disque externe avant chaque build/migration.
- Compte GitHub : pousser avec `gh auth switch --user cuilleredor77`, puis revenir sur `Minosa93`.
  Pas de push forcé : `origin/main` et `claude/site-review-097a64` avancent ensemble en fast-forward.
