# MDM — Mérieux Diagnostic Machine

Site vitrine de MDM (machine de diagnostic pour pharmacies) et de son application compagnon MDIAG.
Projet porté par Marius Mérieux. *Projet en cours de développement — visuels non contractuels.*

Stack : Next.js 15 (App Router), TypeScript, Tailwind CSS, next-intl (FR par défaut / EN), React Three Fiber + drei, react-hook-form + zod, Resend.

## Lancer en local

```bash
npm install
cp .env.example .env.local   # puis renseigner les variables (voir plus bas)
npm run dev                  # http://localhost:3000
```

Autres commandes : `npm run build` (build de production), `npm start` (le servir).

## Structure

```
src/
  app/[locale]/        pages (accueil, machine, mdiag, pharmacies, investors, contact, legal, privacy)
  app/api/contact/     route API d'envoi du formulaire (Resend)
  components/          layout/, ui/, machine/ (3D), mdiag/ (maquettes), sections/
  i18n/                routage et configuration next-intl
  lib/                 hotspots, schéma zod, métadonnées, constantes
  messages/fr.json     tous les textes en français
  messages/en.json     tous les textes en anglais
public/images, public/models
```

Le français est servi sans préfixe (`/machine`), l'anglais sous `/en` (`/en/machine`). Tous les textes sont dans `src/messages/` : modifier un texte = modifier les deux fichiers.

## Remplacer les images

Déposez `machine-1.jpg` à `machine-4.jpg` dans `public/images/` (ratio 4:3 conseillé). Tant qu'un fichier est absent, un visuel de remplacement est affiché. Pour ajouter une image, ajoutez son texte alternatif dans `Machine.gallery.alts` (FR et EN).

## Remplacer le modèle 3D

Déposez un fichier `public/models/mdm.glb` : il est chargé automatiquement à la place de la machine stylisée (redimensionné à 100 cm de long, posé au sol, longueur le long de l'axe X).
Les points cliquables sont définis dans `src/lib/hotspots.ts` (1 unité = 10 cm, y = hauteur) : ajustez leurs `position` pour qu'ils tombent sur les bonnes zones de votre modèle. Les textes des fiches sont dans `Machine.hotspots`.

## Configurer Resend (formulaire de contact)

1. Créez un compte sur [resend.com](https://resend.com) et une clé API.
2. Renseignez dans `.env.local` :
   - `RESEND_API_KEY` : la clé API ;
   - `CONTACT_TO_EMAIL` : l'adresse qui reçoit les messages ;
   - `CONTACT_FROM_EMAIL` : expéditeur, sur un domaine vérifié dans Resend (`onboarding@resend.dev` pour tester) ;
   - `NEXT_PUBLIC_SITE_URL` : URL publique du site.
3. Sans clé, la route répond 503 et le formulaire affiche un message d'erreur.

La clé n'est lue que côté serveur et ne doit jamais être commitée (`.env*` est ignoré par git).

## Déployer sur Vercel

1. Poussez le dépôt sur GitHub.
2. Sur [vercel.com](https://vercel.com), « Add New… → Project », importez le dépôt (framework Next.js détecté automatiquement).
3. Dans *Settings → Environment Variables*, ajoutez les 4 variables de `.env.example`.
4. Déployez. Associez ensuite votre domaine et mettez à jour `NEXT_PUBLIC_SITE_URL`.

## À compléter avant la mise en ligne

- Pages **Mentions légales** et **Confidentialité** : remplacer les champs `[À compléter]` dans `src/messages/*.json`.
- Logo : le logo texte « MDM » est dans `src/components/ui/Logo.tsx`.
- Aucun chiffre n'est présenté hors dimensions de la machine (100 × 60 × 40 cm) : ne pas en inventer.
