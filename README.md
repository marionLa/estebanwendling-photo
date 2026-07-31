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

## Ajouter du contenu (guide pour le photographe)

Aucune interface d'administration n'est nécessaire : ajouter des photos revient à ajouter des fichiers dans le dossier `assets/` du repo GitHub, puis à valider ("commit"). Le site se reconstruit et se republie automatiquement dans les minutes qui suivent.

### Ajouter une nouvelle section au portfolio

1. Dans `assets/`, créer un nouveau dossier avec le nom de la section (ex. `assets/japon/`).
2. Y déposer les photos, en nommant l'une d'elles `couverture.jpg` — c'est celle qui apparaîtra comme vignette dans la grille du portfolio.
3. (Optionnel) créer un fichier texte `assets/japon/infos.txt` avec un lieu par ligne (ex. `Tokyo`, `Kyoto`) — affiché dans la barre latérale de la section.
4. Valider les changements ("commit"). La page `portfolio/japon/` est générée automatiquement, sans rien configurer d'autre.

### Ajouter des photos au diaporama de la page d'accueil

Déposer des fichiers `.jpg` dans `assets/slides/` (pas de sous-dossier, pas de `couverture.jpg`).

### Comment déposer les fichiers, concrètement

- **Sans terminal, depuis le navigateur** : ouvrir le dossier voulu sur GitHub, bouton *Add file → Upload files*, glisser les photos, puis *Commit changes*. Le plus simple pour un usage occasionnel.
- **En ligne de commande (`git`)** : copier les photos dans le dossier local, puis `git add`, `git commit`, `git push`. Nécessaire si on veut lancer le script de compression avant d'envoyer (voir ci-dessous).

### Compresser les photos avant de les envoyer

Le repo doit rester sous ~1 Go au total. Avant de committer nos nouvelles photos en ligne de commande, lancer :

```bash
bash optimize-photos.sh
```

Sur Mac, sans passer par le Terminal : double-cliquer sur `optimiser-photos.command` dans le Finder. Il installe automatiquement les outils nécessaires (Homebrew, ImageMagick, jpegoptim) s'ils manquent, puis lance l'optimisation. *Au tout premier lancement, si le Finder refuse d'ouvrir le fichier ("développeur non identifié"), faire un clic droit dessus → "Ouvrir" (une seule fois).*

Ce script redimensionne (max ~2200px) et recompresse (qualité ~82) toutes les photos de `assets/`, ce qui réduit leur poids de 80-90% sans perte visible à l'écran. **Ne pas le relancer plusieurs fois sur des photos déjà optimisées** (la compression JPEG répétée dégrade la qualité). Si les photos sont ajoutées depuis le navigateur (sans passer par ce script), il vaut mieux les redimensionner soi-même avant (ex. export "web" depuis Lightroom/Photoshop, ~2000-2500px de large).

## Déploiement

Le déploiement se fait automatiquement via GitHub Actions (`.github/workflows/deploy.yml`) à chaque push sur `main`. Voir [CLAUDE.md](CLAUDE.md#déploiement) pour les prérequis côté GitHub (Pages activé, secret `FORMSPREE_ID`).