/**
 * Implements global window.helpers object that contains various helper
 * methods used by Fluxus. It is like 2.0 of utils.js
 */

(function($, window, $window) {
  var helpers = {};

  /**
   * Binds an debounced and namespaced resize event to window.
   * Returns event name to allow unbinding.
   */
  helpers.onWindowResize = function(callback, triggerInstantly, namespace) {
    var namespacedEvent;
    namespace = namespace || '';

    if (namespace) {
      namespacedEvent = 'resize.' + namespace + '.fluxus';
    } else {
      namespacedEvent = 'resize.fluxus';
    }

    $window.on(namespacedEvent, _.debounce(callback, 300));

    if (triggerInstantly) {
      callback();
    }

    return namespacedEvent;
  };

  helpers.runIfFound = function($el, callback) {
    if ($el.length) {
      callback.call($el, $el);
    }
  };

  helpers.imageLoaded = function(url, callback) {
    var image = new Image();
    $(image).load(function() {
      callback.call(this, image);
    });
    image.src = url;
  };

  window.helpers = helpers;
})(jQuery, window, jQuery(window));
