/**
 * Add your modifications here.
 */

/**
 * Fix : le défilement horizontal à la molette "gelait" un instant au début
 * d'un geste de scroll (hors Mac). Le code d'origine (utils.js, Navigation
 * prototype) calibrait le pas de scroll sur le tout premier événement wheel
 * du geste, ce qui produisait un incrément minuscule et fixe (souvent
 * ±30px), déconnecté de la vitesse réelle de la molette, avant que le
 * calcul ne "rattrape" un mouvement normal. On applique directement le
 * delta normalisé, comme c'est déjà fait sur Mac, pour un défilement fluide
 * dès le premier tour de molette sur toutes les plateformes.
 */
if (window.Navigation && Navigation.prototype._onWheelHandlerContinuous) {
  Navigation.prototype._onWheelHandlerContinuous = function (event) {
    if (!this._isActive) {
      return true;
    }

    var isAboveScrollableContainer =
      $(event.target)
        .closest('.scroll-container')
        .find('.scrollbar:first:not(.disable)').length > 0;
    if (isAboveScrollableContainer) {
      return true;
    }

    var e = normalizeWheel(event),
      currentX = $(window).scrollLeft(),
      delta = e.pixelY,
      isVerticalScroll = Math.abs(e.pixelY) > Math.abs(e.pixelX);

    if (isVerticalScroll) {
      event.preventDefault();
    }

    $(window).scrollLeft(currentX + delta);
  };
}

