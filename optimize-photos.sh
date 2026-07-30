#!/usr/bin/env bash
# Redimensionne et compresse les photos de assets/ pour rester sous le budget
# de stockage du repo (objectif : < 1 Go au total).
# Prérequis : ImageMagick (magick), jpegoptim
# Usage : bash optimize-photos.sh
#
# ATTENTION : opération avec perte. Ne pas relancer plusieurs fois sur les
# mêmes fichiers déjà optimisés (dégradation cumulative de la qualité JPEG).

set -e

ASSETS="$(dirname "$0")/assets"
MAX_DIM=2200
QUALITY=82

for cmd in magick jpegoptim; do
  command -v "$cmd" >/dev/null 2>&1 || { echo "Erreur : '$cmd' n'est pas installé." >&2; exit 1; }
done

total_before=0
total_after=0
count=0

while IFS= read -r -d '' file; do
  before=$(stat -c%s "$file")
  tmp="$file.tmp"

  magick "$file" -resize "${MAX_DIM}x${MAX_DIM}>" -quality "$QUALITY" -strip "$tmp"
  jpegoptim --quiet --strip-all "$tmp"

  after=$(stat -c%s "$tmp")
  if [ "$after" -lt "$before" ]; then
    mv "$tmp" "$file"
  else
    rm -f "$tmp"
    after=$before
  fi

  total_before=$((total_before + before))
  total_after=$((total_after + after))
  count=$((count + 1))
  printf "  %-60s %6d Ko -> %6d Ko\n" "${file#$ASSETS/}" "$((before / 1024))" "$((after / 1024))"
done < <(find "$ASSETS" -type f \( -iname "*.jpg" -o -iname "*.jpeg" \) -print0)

echo ""
echo "Terminé : $count photos traitées."
printf "Total : %d Mo -> %d Mo (gain : %d%%)\n" \
  "$((total_before / 1024 / 1024))" \
  "$((total_after / 1024 / 1024))" \
  "$(( (total_before - total_after) * 100 / total_before ))"
