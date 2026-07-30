# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

Site vitrine de photographie — migration de http://estebanwendling.fr (WordPress + thème Fluxus) vers GitHub Pages statique (Jekyll).

## Commandes

```bash
bundle exec jekyll serve   # serveur local → http://localhost:4000
bundle exec jekyll build   # build production dans _site/
```

## Architecture

**Générateur** : Jekyll 4 + plugin Ruby `_plugins/sections_generator.rb`
- Scanne `assets/` à la recherche de sous-dossiers contenant `couverture.jpg`
- Peuple `site.data['sections']` et `site.data['slides']` au moment du build
- Génère les pages `portfolio/<slug>/index.html` automatiquement
- Lit les dimensions JPEG de chaque photo (parser binaire natif, sans gem)
- Lit `assets/<section>/infos.txt` pour les métadonnées de chaque section

**CSS/JS** : assets du thème Fluxus copiés dans `assets/fluxus/` (pas de npm, pas de bundler)

**Layouts** :
- `home.html` — image aléatoire plein écran (tirée de `assets/slides/` côté JS)
- `portfolio.html` — grille 3×2 des sections (Fluxus `portfolio-grid`)
- `section.html` — scroll horizontal avec sidebar gauche (titre + infos), lightbox custom au clic (`assets/js/lightbox.js` + `assets/css/section.css`)
- `default.html` — page texte (utilisée par À propos)

**Page À propos** (`a-propos/index.html`) : contenu centré sur 640px max, paragraphes alignés à gauche, formulaire de contact centré sur 480px max.

## Ajout de contenu

**Nouvelle section** : créer `assets/nomsection/` avec `couverture.jpg` (couverture) + les autres photos. Optionnellement, ajouter `assets/nomsection/infos.txt` (un lieu par ligne). Le plugin détecte tout automatiquement au build suivant.

**Photos du slider d'accueil** : ajouter des `.jpg` dans `assets/slides/`.

**Infos de section** : `assets/<section>/infos.txt`, un lieu par ligne.

## Design

Reproduit fidèlement le thème Fluxus original :
- Typographie : Lato (300/400/700) + Merriweather (Google Fonts)
- Couleurs : fond `#fff`, texte `#111116`
- Header fixe en haut (70px), footer fixe en bas (50px)
- `html.horizontal-page` sur les pages galerie/portfolio (scroll horizontal, header/footer fixed)
- `html.horizontal-page.no-scroll` sur la home (pas de scroll)

## Formulaire de contact

Formspree — l'adresse de réception est configurée dans le dashboard Formspree uniquement, jamais dans le code. L'ID du formulaire est injecté via le secret GitHub `FORMSPREE_ID` à la build (variable `site.formspree_id` dans `_config.yml`).

## Déploiement

GitHub Actions (`.github/workflows/deploy.yml`) — déclenché à chaque push sur `main` :
1. `ruby/setup-ruby` + `bundle install`
2. Injection du secret `FORMSPREE_ID` dans `_config.yml`
3. `jekyll build`
4. `actions/deploy-pages`

Prérequis côté GitHub : activer Pages (Settings → Pages → Source : GitHub Actions) + secret `FORMSPREE_ID`.
