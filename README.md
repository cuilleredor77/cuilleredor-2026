# Cuillère d'Or — Catalogue 2026

Site vitrine du traiteur Cuillère d'Or, construit avec [vinext](https://github.com/cloudflare/vinext) (Next.js sur Cloudflare Workers) et déployé comme Worker Cloudflare avec assets statiques.

## Prérequis

- Node.js `>=22.13.0`

## Commandes

- `npm install` : installe les dépendances
- `npm run dev` : lance le serveur de développement (Vite/Vinext)
- `npm run build` : build l'artefact déployable (`dist/client` + `dist/server`)
- `npm run start` : démarre l'application buildée en local
- `npm run deploy` : build puis déploie sur Cloudflare (`wrangler deploy`)
- `npm test` : build puis vérifie le rendu HTML
- `npm run lint` : ESLint
- `npm run db:generate` : génère les migrations Drizzle après modification du schéma (non utilisé actuellement, la base D1 est vide par défaut)

## Structure

- `app/` : pages et composants du site (Next.js App Router)
- `worker/index.ts` : point d'entrée du Worker Cloudflare (routage + optimisation d'images)
- `vite.config.ts` : bindings Cloudflare simulés en développement local
- `wrangler.jsonc` : configuration de déploiement Cloudflare (assets, images, compte)
- `db/` : scaffold Drizzle/D1, vide par défaut (`db/schema.ts`)

## Déploiement

```bash
npm install
npm run deploy
```

`wrangler deploy` publie le Worker sur `*.workers.dev` et sur tout domaine personnalisé configuré dans `wrangler.jsonc`.

## En savoir plus

- [Documentation vinext](https://github.com/cloudflare/vinext)
- [Guide Drizzle + D1](https://orm.drizzle.team/docs/get-started/d1-new)
