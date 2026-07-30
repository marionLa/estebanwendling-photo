# SPEC.md — Site vitrine Esteban Wendling

Ce document contient les spécifications complètes pour régénérer ce site from scratch.

---

## Contexte

Site vitrine de photographie pour Esteban Wendling, migré depuis WordPress (thème Fluxus) vers GitHub Pages statique. Le photographe n'a pas d'interface d'administration : il gère le contenu en déposant des fichiers dans des dossiers.

---

## Stack

- **Générateur** : Jekyll 4 (`gem "jekyll", "~> 4.3"` + `gem "webrick"`)
- **CSS/JS** : thème Fluxus (assets copiés depuis le site WordPress original, sans modification)
- **Formulaire de contact** : Formspree (email masqué côté serveur)
- **Déploiement** : GitHub Actions → GitHub Pages

---

## Structure des fichiers

```
├── _config.yml
├── Gemfile
├── _plugins/
│   └── sections_generator.rb   ← cœur du système, génère tout automatiquement
├── _layouts/
│   ├── home.html
│   ├── portfolio.html
│   ├── section.html
│   └── default.html
├── _includes/
│   ├── head.html
│   ├── header.html
│   ├── footer.html
│   └── contact-form.html
├── assets/
│   ├── fluxus/                 ← CSS/JS/fonts du thème Fluxus (copiés tels quels)
│   │   ├── css/                  normalize, global, icomoon, style, responsive, user, swiper, plyr
│   │   ├── js/                   main, utils, helpers, full-page-slider, jquery.fluxus-grid,
│   │   │                         jquery.fluxus-lightbox, jquery.reveal, burger-menu, swiper,
│   │   │                         hammer.min, iscroll, fastclick, tinyscrollbar, lazysizes,
│   │   │                         underscore.min, plyr.min, user, normalize-wheel, jquery.sharrre
│   │   └── fonts/                icomoon.svg/.ttf/.woff
│   ├── images/                 ← images du thème (logo, favicons, placeholder)
│   │   ├── logod.jpg             logo du site (42px de hauteur dans le header)
│   │   ├── portrait.jpg          photo de la page À propos
│   │   ├── 16-9.png              placeholder d'aspect ratio (non utilisé, conservé)
│   │   ├── left.svg / right.svg  flèches du thème
│   │   ├── slash.png / slash@2x.png
│   │   └── favicon/              favicon-32.jpg, favicon-192.jpg, apple-touch-icon.jpg
│   ├── slides/                 ← photos pour le slider aléatoire de la home
│   ├── css/
│   │   └── section.css         ← CSS custom pour la vue section (hauteur uniforme + lightbox)
│   ├── js/
│   │   └── lightbox.js         ← lightbox custom vanilla JS
│   │
│   ├── alsace/                 ← section photo (détectée automatiquement par le plugin)
│   ├── amerique-latine/
│   ├── asie/
│   ├── europe/
│   ├── france/
│   └── vosges/
├── index.html                  ← layout: home
├── portfolio/
│   └── index.html              ← layout: portfolio
└── a-propos/
    └── index.html              ← layout: default
```

---

## Plugin Ruby — `_plugins/sections_generator.rb`

C'est la pièce centrale. Il s'exécute pendant le build Jekyll et remplace un script de pré-génération.

**Ce qu'il fait :**
1. Scanne `assets/` à la recherche de sous-dossiers contenant `couverture.jpg`
2. Ignore : `fluxus`, `images`, `slides`, `.`, `..`
3. Pour chaque section détectée :
   - Liste les photos (tous fichiers images sauf `couverture.jpg`), triées alphabétiquement
   - Lit les dimensions JPEG de chaque photo via un parseur binaire natif (sans gem externe)
   - Lit `infos.txt` (un lieu par ligne) s'il existe
   - Dérive le titre du slug (tirets → espaces, capitalize)
4. Peuple `site.data['sections']` et `site.data['slides']`
5. Génère les pages `portfolio/<slug>/index.html` comme objets `Jekyll::Page`

**Structure de données `site.data['sections']` :**
```ruby
[{
  'slug'   => 'alsace',
  'title'  => 'Alsace',
  'cover'  => 'assets/alsace/couverture.jpg',
  'photos' => [{ 'src' => 'assets/alsace/EW28605.jpg', 'width' => 640, 'height' => 480 }, ...],
  'infos'  => ['Strasbourg', 'Colmar']
}, ...]
```

**Parseur JPEG (sans gem) :**
Lit les marqueurs SOF (0xC0–0xCF sauf 0xC4/0xC8/0xCC) pour extraire largeur × hauteur. Utilise `getbyte()` pour éviter les problèmes d'encodage Ruby avec les strings binaires.

---

## Design — thème Fluxus

### Typographie
- Corps : `Lato` 300/400/700 (Google Fonts)
- Titres/captions : `Merriweather` (Google Fonts)

### Couleurs
- Fond : `#fff`
- Texte : `#111116`
- Liens au hover : `#333`

### Layout système (Fluxus)
- `html.horizontal-page` : header fixe (70px), footer fixe (50px), scroll horizontal
- `html.horizontal-page.no-scroll` : idem + overflow hidden (utilisé sur la home)
- `html` sans ces classes : layout vertical classique (page À propos)
- `.site` : `margin: 0 16px` par défaut
- `.site-footer-push` : spacer de 50px (masqué sur les pages horizontal)

### Navigation
Logo image (`logod.jpg`, 42px de hauteur) + menu texte : Accueil / Portfolio / A propos

### Footer
Icônes icomoon : Instagram (`icon-instagram-with-circle`) + LinkedIn (`icon-linkedin-with-circle`), copyright, astuce navigation clavier

---

## Pages et layouts

### Home (`layout: home`)

- `html.horizontal-page.no-scroll`
- `#hero` : `position: fixed; top: 70px; bottom: 50px; left: 0; right: 0`
- Background image choisie aléatoirement au chargement via JS parmi `site.data['slides']`
- JS inline : `var slides = {{ site.data.slides | jsonify }}; document.getElementById('hero').style.backgroundImage = 'url(' + slides[Math.floor(Math.random()*slides.length)] + ')'`

### Portfolio (`layout: portfolio`)

- `html.layout-portfolio-grid.layout-portfolio-grid-horizontal.horizontal-page`
- `body.archive.tax-fluxus-project-type`
- Grille Fluxus : `<div class="portfolio-grid js-portfolio-grid" data-aspect-ratio="auto" data-orientation="horizontal" data-columns="3" data-rows="2">`
- Chaque section : `<article class="grid-project js-grid-project size-1">` avec image de couverture en `background-image` et overlay radial + titre au survol

### Section (`layout: section`)

- `html.horizontal-page`
- `body.fluxus_portfolio-template-default.single.single-fluxus_portfolio`
- `div#main.site.site--has-sidebar` : deux colonnes flexbox
  - **Gauche** : `div.sidebar.sidebar-portfolio-single` (ordre CSS 1 = affiché à gauche)
    - Scroll container Fluxus (tinyscrollbar)
    - `hgroup > h1.title` : nom de la section
    - `aside.widget.widget-project-custom-info` : widget "Infos" avec la liste des lieux
  - **Droite** : `div#content.site-content` (ordre CSS 2 = affiché à droite)
    - `article.js-portfolio-single.horizontal-content` : scroll horizontal
    - `figure.horizontal-content__item` par photo (inline-block)
    - `div.horizontal-media.aspect.aspect--image > div.aspect__media > img`
    - Images chargées directement avec `src` (pas de lazyload)

**CSS custom `assets/css/section.css` :**
- Hauteur uniforme : `height: calc(100vh - 180px)` sur `.horizontal-content__item`
- Marges : 50px entre photos (`margin-right`), 50px avant la première (`margin-left`)
- Masque `.aspect__placeholder` (display: none)
- `cursor: pointer` sur figures et images
- Styles de la lightbox (`.lb-overlay`, `.lb-img`, `.lb-close`, `.lb-prev`, `.lb-next`)

**Lightbox `assets/js/lightbox.js` :**
- Vanilla JS, IIFE
- Construit un overlay `.lb-overlay` injecté dans `<body>`
- Collecte les `src` de tous les `img` dans `.horizontal-content__item`
- Clic sur figure → ouverture ; ×/Échap → fermeture ; ‹/›/flèches clavier → navigation
- `body.style.overflow = 'hidden'` pendant l'affichage

### À propos (`layout: default`)

- `html` sans classes Fluxus (layout vertical)
- `.fluid-width-container` avec `margin: 0 auto` (override nécessaire car Fluxus ne centre pas)
- Article centré à `max-width: 640px; margin: 0 auto`
- Paragraphes alignés à gauche
- Formulaire de contact centré à `max-width: 480px; margin: 0 auto`

---

## Formulaire de contact

- Service : Formspree (`https://formspree.io/f/{ID}`)
- Champs : nom, email, message + honeypot `_gotcha` (anti-spam)
- L'adresse de réception est configurée dans le dashboard Formspree — jamais dans le code
- L'ID Formspree est stocké en secret GitHub `FORMSPREE_ID`, injecté dans `_config.yml` (variable `site.formspree_id`) via `sed` dans le workflow

---

## Gestion du contenu

### Ajouter une section
1. Créer `assets/nomsection/`
2. Y déposer `couverture.jpg` (photo de couverture)
3. Déposer les autres photos (noms libres, extensions .jpg/.jpeg/.png/.gif/.webp)
4. Optionnel : créer `assets/nomsection/infos.txt` (un lieu par ligne)
5. Pousser sur `main` → GitHub Actions redéploie

### Ajouter des photos au slider de la home
Déposer des `.jpg` dans `assets/slides/`.

### Modifier les infos d'une section
Éditer `assets/<section>/infos.txt`.

---

## Déploiement GitHub Actions

Fichier : `.github/workflows/deploy.yml`

```yaml
on: push (branches: [main]) + workflow_dispatch
permissions: pages: write, id-token: write

jobs:
  build:
    - actions/checkout@v4
    - ruby/setup-ruby@v1 (ruby 3.2, bundler-cache: true)
    - sed -i "s/formspree_id: \"\"/formspree_id: \"${{ secrets.FORMSPREE_ID }}\"/" _config.yml
    - bundle exec jekyll build (JEKYLL_ENV: production)
    - actions/upload-pages-artifact@v3 (path: _site)
  deploy:
    - actions/deploy-pages@v4
```

**Prérequis côté GitHub :**
- Settings → Pages → Source : **GitHub Actions**
- Secret `FORMSPREE_ID` avec l'ID du formulaire Formspree

---

## Sections et photos existantes

| Section | Couverture | Lieux (infos.txt) | Nb photos |
|---|---|---|---|
| alsace | EW28605.jpg | Strasbourg, Colmar | 16 |
| amerique-latine | EW63950.jpg | Argentine, Chili, Bolivie | 32 |
| asie | EW51267.jpg | Birmanie | 23 |
| europe | EW25393.jpg | Espagne, Italie, Svalbard, Pays-Bas, Suisse, Croatie, République tchèque, Bosnie-Herzégovine, Finlande | 39 |
| france | EW27642.jpg | Paris, Provence, Alpes, Bordeaux, Nantes | 13 |
| vosges | EW12297.jpg | Vallée de Munster, Vallée de Villé, Vallée de la Thur | 27 |

Slider home : 12 photos dans `assets/slides/`.

---

## Points d'attention

- **Fluxus et jQuery** : `underscore.min.js` doit être chargé avant `jquery.fluxus-grid.js` (requis pour `_.debounce`). Charger dans `_includes/head.html` après jQuery.
- **Fluxus grid** : la classe CSS `portfolio-grid` a `opacity: 0` par défaut ; le JS Fluxus ajoute `portfolio-grid--loaded` après initialisation pour révéler la grille.
- **Parseur JPEG** : utiliser `getbyte()` pour comparer les bytes (pas `==` avec string literal), sinon la comparaison échoue à cause de l'encodage Ruby.
- **Centrage page À propos** : `.fluid-width-container` de Fluxus n'a pas de `margin: auto`, il faut l'ajouter dans le layout `default.html`.
- **Home** : les classes `horizontal-page no-scroll` sur `<html>` sont indispensables pour que le header et footer soient fixés (Fluxus CSS).
- **Sections** : ne pas mettre `portfolio-single--onclick-lightbox` ni `js-lightbox-media` (déclenche le lightbox Fluxus WordPress qui n'est pas compatible).
