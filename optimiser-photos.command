#!/usr/bin/env bash
# Double-cliquable depuis le Finder (Mac) : installe les outils nécessaires
# si besoin, puis lance optimize-photos.sh sur le dossier assets/ du repo.
#
# Premier lancement : si le Finder refuse d'ouvrir ce fichier ("développeur
# non identifié"), faire un clic droit dessus puis "Ouvrir" (une seule fois).

set -e

cd "$(dirname "$0")"

echo "=== Optimisation des photos ==="
echo ""

if ! command -v brew >/dev/null 2>&1; then
  echo "Homebrew n'est pas installé sur cet ordinateur : installation en cours..."
  echo "(Une fenêtre va vous demander votre mot de passe Mac, c'est normal.)"
  echo ""
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

  if [ -x /opt/homebrew/bin/brew ]; then
    eval "$(/opt/homebrew/bin/brew shellenv)"
  elif [ -x /usr/local/bin/brew ]; then
    eval "$(/usr/local/bin/brew shellenv)"
  fi
fi

for pkg in imagemagick jpegoptim; do
  if ! brew list "$pkg" >/dev/null 2>&1; then
    echo "Installation de l'outil '$pkg'..."
    brew install "$pkg"
  fi
done

echo ""
echo "Tout est prêt. Lancement de l'optimisation des photos..."
echo ""

bash optimize-photos.sh

echo ""
echo "=== Terminé ! Vous pouvez fermer cette fenêtre. ==="
read -r -p "Appuyez sur Entrée pour fermer..." _
