#!/usr/bin/env bash
# Télécharge toutes les photos du site original organisées par section.
# Prérequis : curl, accès à estebanwendling.fr
# Usage : bash download-photos.sh

set -e
BASE="http://estebanwendling.fr/wp-content/uploads/2018/10"
ASSETS="$(dirname "$0")/assets"

download() {
  local section="$1"
  local file="$2"
  local dest="$ASSETS/$section/$file"
  if [ -f "$dest" ]; then
    echo "  skip  $section/$file"
    return
  fi
  echo "  fetch $section/$file"
  curl -sf "$BASE/$file" -o "$dest" || echo "  ERREUR : $BASE/$file"
}

mkdir -p \
  "$ASSETS/alsace" \
  "$ASSETS/amerique-latine" \
  "$ASSETS/asie" \
  "$ASSETS/europe" \
  "$ASSETS/france" \
  "$ASSETS/vosges"

echo "=== Alsace ==="
for f in \
  DSC_4324.jpg EW13461.jpg EW21117.jpg EW26173.jpg EW27265.jpg EW27542.jpg \
  EW28605.jpg  EW33809.jpg EW37452.jpg EW41149.jpg EW41498.jpg EW41968-1.jpg \
  EW42155.jpg  EW48702.jpg EW48817.jpg EW55141.jpg
do download alsace "$f"; done
# Photo de couverture
cp "$ASSETS/alsace/EW28605.jpg" "$ASSETS/alsace/couverture.jpg" 2>/dev/null || true

echo "=== Amérique latine ==="
for f in \
  EW29694.jpg EW29713.jpg EW29714.jpg EW29744.jpg EW30638.jpg EW61316.jpg \
  EW61406.jpg EW61712.jpg EW61794.jpg EW61824.jpg EW61832.jpg EW61890.jpg \
  EW61965.jpg EW61997.jpg EW62098.jpg EW62193.jpg EW62278.jpg EW62305.jpg \
  EW62348.jpg EW62361.jpg EW62386.jpg EW62422.jpg EW62588.jpg EW62762.jpg \
  EW62773.jpg EW62874.jpg EW63078.jpg EW63100.jpg EW63238.jpg EW63776.jpg \
  EW63867.jpg EW63920.jpg EW63950.jpg
do download amerique-latine "$f"; done
cp "$ASSETS/amerique-latine/EW63950.jpg" "$ASSETS/amerique-latine/couverture.jpg" 2>/dev/null || true

echo "=== Asie ==="
for f in \
  EW49891.jpg EW49895.jpg EW49907.jpg EW49916.jpg EW49985.jpg EW50008.jpg \
  EW50023.jpg EW50047.jpg EW50171.jpg EW50431.jpg EW50516.jpg EW50549.jpg \
  EW50727.jpg EW50789.jpg EW50822.jpg EW50884.jpg EW51267.jpg EW51434.jpg \
  EW51579.jpg EW51592.jpg EW51693.jpg EW81.jpg EW84.jpg EW85.jpg
do download asie "$f"; done
cp "$ASSETS/asie/EW51267.jpg" "$ASSETS/asie/couverture.jpg" 2>/dev/null || true

echo "=== Europe ==="
for f in \
  DSC_3472.jpg EW14996.jpg EW18417.jpg EW18685.jpg EW20761.jpg EW23976.jpg \
  EW25393.jpg  EW25506.jpg EW25646.jpg EW35230.jpg EW35500b.jpg EW35724.jpg \
  EW36013.jpg  EW36069.jpg EW36452b.jpg EW36763.jpg EW36877.jpg EW36944.jpg \
  EW37125b.jpg EW37770.jpg EW37786.jpg EW37911.jpg EW37974.jpg EW38198.jpg \
  EW38368.jpg  EW38795.jpg EW40066.jpg EW40097.jpg EW40225.jpg EW40454.jpg \
  EW40712.jpg  EW40860.jpg EW43374.jpg EW43554.jpg EW44443.jpg EW54517.jpg \
  EW54610.jpg  EW65196.jpg EW70898.jpg EW8784.jpg
do download europe "$f"; done
cp "$ASSETS/europe/EW25393.jpg" "$ASSETS/europe/couverture.jpg" 2>/dev/null || true

echo "=== France ==="
for f in \
  EW11831.jpg EW19141.jpg EW21341.jpg EW27642.jpg EW29155.jpg EW29367.jpg \
  EW44851.jpg EW45073.jpg EW45227.jpg EW45596.jpg EW53404.jpg EW53472.jpg \
  EW72432.jpg EW72500.jpg
do download france "$f"; done
cp "$ASSETS/france/EW27642.jpg" "$ASSETS/france/couverture.jpg" 2>/dev/null || true

echo "=== Vosges ==="
for f in \
  DSC_3272.jpg DSC_6035.jpg DSC_6175.jpg DSC_6636.jpg DSC_7302.jpg \
  EW12292.jpg  EW12297.jpg  EW1238.jpg   EW13775.jpg  EW14872.jpg \
  EW17698.jpg  EW20275.jpg  EW20343.jpg  EW20901.jpg  EW21232.jpg \
  EW22491.jpg  EW23149.jpg  EW32839.jpg  EW34557.jpg  EW35437.jpg \
  EW48567.jpg  EW56255.jpg  EW5781.jpg   EW59864.jpg  EW60169.jpg \
  EW60544.jpg  EW60892.jpg  EW9240.jpg
do download vosges "$f"; done
cp "$ASSETS/vosges/EW12297.jpg" "$ASSETS/vosges/couverture.jpg" 2>/dev/null || true

echo ""
echo "Terminé. Photos par section :"
for d in alsace amerique-latine asie europe france vosges; do
  echo "  $d : $(ls "$ASSETS/$d" | wc -l) fichiers"
done
