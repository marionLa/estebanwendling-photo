# Esteban Wendling — Photographie

Site vitrine de photographie, migré de [estebanwendling.fr](http://estebanwendling.fr) (WordPress + thème Fluxus) vers un site statique Jekyll hébergé sur GitHub Pages.

## Prérequis

- Ruby (voir `Gemfile.lock` pour la version testée)
- Bundler (`gem install bundler`)

## Installation

```bash
bundle install
```

## Développement local

```bash
bundle exec jekyll serve   # → http://localhost:4000
```

## Build production

```bash
bundle exec jekyll build   # sortie dans _site/
```

## Architecture

Le site est généré par Jekyll 4 avec un plugin Ruby maison (`_plugins/sections_generator.rb`) qui :

- scanne `assets/` à la recherche de sous-dossiers contenant une `couverture.jpg` ;
- peuple `site.data['sections']` et `site.data['slides']` au moment du build ;
- génère automatiquement les pages `portfolio/<slug>/index.html` ;
- lit les dimensions de chaque photo JPEG (parser binaire natif, sans gem) ;
- lit `assets/<section>/infos.txt` pour les métadonnées de chaque section.

Le CSS/JS provient du thème Fluxus d'origine, copié tel quel dans `assets/fluxus/` (pas de npm, pas de bundler).

Pour plus de détails (layouts, ajout de contenu, formulaire de contact, déploiement), voir [CLAUDE.md](CLAUDE.md) et [SPEC.md](SPEC.md).

## Ajouter du contenu

**Nouvelle section** : créer `assets/nomsection/` avec une `couverture.jpg` (couverture) et les autres photos. Optionnellement, ajouter `assets/nomsection/infos.txt` (un lieu par ligne). Le plugin détecte tout automatiquement au build suivant.

**Photos du slider d'accueil** : ajouter des `.jpg` dans `assets/slides/`.

## Déploiement

Le déploiement se fait automatiquement via GitHub Actions (`.github/workflows/deploy.yml`) à chaque push sur `main`. Voir [CLAUDE.md](CLAUDE.md#déploiement) pour les prérequis côté GitHub (Pages activé, secret `FORMSPREE_ID`).