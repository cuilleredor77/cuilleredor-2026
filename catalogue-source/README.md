# Catalogue Cuillère d'Or 2027-2028 (sources)

Sources du catalogue en ligne (https://catalogue.cuilleredor.fr), hébergé sur Cloudflare Pages (projet `catalogue-cuilleredor`).

- `index.fr.html`, `en/index.html` : pages du catalogue (français, anglais). `index.merged.html` : fusion bilingue (c'est elle que lit `build_site.py`).
- `images/`, `icons/` : photos et favicons.
- `build_site.py` : génère `../catalogue-site/` (dossier déployé : page, menu PDF, « Envoyer ma sélection », images utilisées, PDF). Les PDF finaux sont ceux de `../public/catalogue/`.
- `liseuse/`, `build_liseuse.py` : liseuse « feuilletage » (https://catalogue.cuilleredor.fr/liseuse/). Les pages des PDF FR/EN sont converties en images WebP au build (PyMuPDF requis : `pip3 install pymupdf`). Moteur : StPageFlip (licence MIT, `liseuse/page-flip.browser.js`). Lien direct vers une page : `/liseuse/#p=12`, en anglais : `/liseuse/?lang=en`.
- `topdf.js`, `topdf-theme.js`, `shot*.js` : génération des PDF et captures avec Playwright.

Mise à jour du site :

```bash
cd catalogue-source && python3 build_site.py
cd /tmp && npx wrangler pages deploy "<chemin>/catalogue-site" --project-name catalogue-cuilleredor --branch main --commit-dirty=true
```

Note : Cloudflare met les PDF en cache 24 h. Si un PDF change sans changer de nom, incrémenter le `?v=` des liens dans `build_site.py`.
