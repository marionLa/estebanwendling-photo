/**
 * This file contains various functions and tiny
 * plugins mainly used by main.js
 */

/**
 * Detection for various devices and browsers.
 *
 * window.device
 */
(function($) {
  var $html = $('html'),
    userAgent = window.navigator.userAgent.toLowerCase(),
    check = function(needle) {
      return userAgent.indexOf(needle) !== -1;
    };

  window.device = {
    iphone: check('iphone'),
    ipad: check('ipad'),
    ipod: check('ipod'),
    android: check('android'),
    blackberry: check('blackberry') || check('bb10') || check('rim')
  };

  device.ios = device.iphone || device.ipod || device.ipad;
  device.mobile = device.ios || device.android;

  device.ios4 = (function() {
    if (device.ios) {
      if (/OS [2-4]_\d(_\d)? like Mac OS X/i.test(userAgent)) {
        $html.addClass('ipad-ios4');
        return true;
      } else if (/CPU like Mac OS X/i.test(userAgent)) {
        $html.addClass('ipad-ios4');
        return true;
      }
    }
    return false;
  })();

  $html.addClass(device.mobile ? 'mobile-device' : 'non-mobile-device');
})(jQuery);

/**
 * jQuery plugins
 */
(function($, window, $window, isUndefined) {
  $.support.transform = (function() {
    var elStyle = document.createElement('div').style;

    return (
      elStyle.transition !== isUndefined ||
      elStyle.WebkitTransition !== isUndefined ||
      elStyle.MozTransition !== isUndefined ||
      elStyle.MsTransition !== isUndefined ||
      elStyle.OTransition !== isUndefined
    );
  })();

  /**
   * Preloads images. Usage:
   *
   * $.preloadImage(src).then(function(img) {
   *   alert(img.width)
   * });
   */
  $.preloadImage = function(src) {
    var image = new Image(),
      dfd = new $.Deferred();

    image.onload = dfd.resolve;
    image.onerror = dfd.reject;
    image.src = src;

    return dfd;
  };

  /**
   * Returns highest DOM element in the jQuery array.
   */
  $.fn.highestElement = function() {
    var $el = $(this),
      elementHeight = 0,
      elementIndex = false;

    $el.each(function(index) {
      var height = $(this).outerHeight();

      if (height > elementHeight) {
        elementHeight = height;
        elementIndex = index;
      }
    });

    return elementIndex !== false ? $el.eq(elementIndex) : $('');
  };
})(jQuery, window, jQuery(window));

/**
 * --------------------------------------------------------------------
 * Keyboard arrows & mousewheel navigation.
 * --------------------------------------------------------------------
 */
(function($, $window, $document) {
  Navigation = function(options) {
    this.options = $.extend({}, Navigation.defaults, options);
    this.$items = [];
    this.$html = $('html,body');
    this._scrollingInProgress = false;
    this._enabled = false;
    this._isActive = false;
    this._onWheelHandlerContinuous = this._onWheelHandlerContinuous.bind(this);
    this._determineIfActive = this._determineIfActive.bind(this);

    this.nextItem = this.nextItem.bind(this);
    this.previousItem = this.previousItem.bind(this);
    this.enable = this.enable.bind(this);
    this.disable = this.disable.bind(this);

    this.enable();
  };

  Navigation.defaults = {
    nextItem: null,
    onNextItem: null,
    previousItem: null,
    onPreviousItem: null,
    onActive: null,
    onInactive: null
  };

  Navigation.prototype = {
    enable: function() {
      if (this._enabled) {
        return;
      }

      if (!this._eventsBinded) {
        this._bindEvents();
        this._eventsBinded = true;
      }

      this._enabled = true;
      this._determineIfActive();
    },

    disable: function() {
      if (!this._enabled) {
        return;
      }

      this._enabled = false;
    },

    _bindEvents: function() {
      window.addEventListener('mousewheel', this._onWheelHandlerContinuous, {
        passive: false
      });
      window.addEventListener(
        'DOMMouseScroll',
        this._onWheelHandlerContinuous,
        { passive: false }
      );
      window.addEventListener('wheel', this._onWheelHandlerContinuous, {
        passive: false
      });
      this.bindKeyboardEvents();
      $window.on('load', this._determineIfActive);
      $window.on(
        'resize',
        _.debounce(this._determineIfActive, 300, { trailing: true })
      );
    },

    _determineIfActive: function(retry) {
      var wasActive = this._isActive;
      var hasScroll = $(window).width() < $(document).width();
      var isActive = hasScroll;

      if (wasActive === isActive) {
        /**
         * Upon resize it takes time for browser to re-render.
         * Here we check multiple times to see if $(document).width()
         * really hasn't changed and scroll hasn't been introduced.
         */
        var maxRetries = 5;
        retry = isNaN(retry) ? 0 : retry;
        if (!retry || retry < maxRetries) {
          setTimeout(this._determineIfActive, 300, retry + 1);
        }
        return;
      }
      this._isActive = isActive;

      if (wasActive && !isActive) {
        this.options.onInactive && this.options.onInactive.call(this);
      }

      if (!wasActive && isActive) {
        this.options.onActive && this.options.onActive.call(this);
      }
    },

    nextItem: function() {
      if (this.options.nextItem) {
        this.options.nextItem.call(this);
      } else {
        var active = this.getActive();

        if (active.distance < -30) {
          this.scrollToItem(active.item);
        } else {
          var index = this.$items.index(active.item);
          this.scrollToItem(this.$items.eq(index + 1));
        }
      }

      this.options.onNextItem && this.options.onNextItem.call(this);
    },

    previousItem: function() {
      if (this.options.previousItem) {
        this.options.previousItem.call(this);
      } else {
        var active = this.getActive();

        if (active.distance > 30) {
          this.scrollToItem(active.item);
        } else {
          var index = this.$items.index(active.item);
          if (0 !== index) {
            this.scrollToItem(this.$items.eq(index - 1));
          } else {
            this.scrollTo(0);
          }
        }
      }

      this.options.onPreviousItem && this.options.onPreviousItem.call(this);
    },

    setItems: function($items) {
      this.$items = $items;
      this._determineIfActive();
    },

    getActive: function() {
      var center = $window.scrollLeft() + $window.width() / 2,
        distances = [],
        distancesAbs = [],
        minDistance = 0,
        index = 0;

      this.$items.each(function() {
        var $t = $(this),
          left = parseInt($t.offset().left, 10),
          right = left + parseInt($t.width(), 10),
          distance = center - (right - $t.width() / 2);

        distances.push(distance);
        distancesAbs.push(Math.abs(distance));
      });

      minDistance = Math.min.apply(Math, distancesAbs);
      index = distancesAbs.indexOf(minDistance);

      return {
        item: this.$items.eq(index),
        distance: distances[index]
      };
    },

    isMac: navigator.platform.toUpperCase().indexOf('MAC') >= 0,

    _onWheelHandlerContinuous: function(event) {
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
        currentX = $window.scrollLeft(),
        delta = e.pixelY,
        isVerticalScroll = Math.abs(e.pixelY) > Math.abs(e.pixelX);

      if (isVerticalScroll) {
        event.preventDefault();
      }

      if (this.isMac) {
        $window.scrollLeft(currentX + delta);
      } else {
        clearTimeout(this._onWheelStepTimeout);
        this._onWheelStepTimeout = setTimeout(function() {
          this._onWheelStep = null;
        }, 1000);

        if (!this._onWheelStep) {
          this._onWheelStep = Math.abs(delta);
        }
        delta = Math.round(delta / this._onWheelStep);

        $window.scrollLeft(currentX + delta * 30);
      }
    },

    scrollTo: function(x) {
      if ($window.width() >= $document.width() || this._scrollingInProgress) {
        return;
      }

      var that = this;
      this._scrollingInProgress = true;

      this.$html.animate({ scrollLeft: x }, 300, function() {
        that._scrollingInProgress = false;
      });
    },

    scrollToItem: function($item) {
      if ($item && $item.length && $window.width() < $document.width()) {
        this.scrollTo(
          $item.offset().left - ($window.width() - $item.width()) / 2
        );
      }
    },

    bindKeyboardEvents: function() {
      var that = this;
      var RIGHT_ARROW_CODE = 39;
      var LEFT_ARROW_CODE = 37;

      $(window).on('keydown.navigation.fluxus', function(e) {
        if (!that._isActive) {
          return true;
        }

        if (!e.metaKey) {
          if (RIGHT_ARROW_CODE === e.which) {
            that.nextItem();
            e.preventDefault();
          } else if (LEFT_ARROW_CODE === e.which) {
            that.previousItem();
            e.preventDefault();
          }
        }
      });
    }
  };

  /**
   * Appreciate Widget
   */
  $.Appreciate = function(options, element, callback) {
    this.$element = $(element);
    this.callback = callback;
    this.options = $.extend({}, $.Appreciate.settings, options);
    this.ajaxurl = this.$element.data('ajaxurl');
    this.id = this.$element.data('id');
    this.titleAfter = this.$element.data('title-after');

    this._init();
  };

  $.Appreciate.settings = {
    template: '<b class="numbers">{count}</b>'
  };

  $.Appreciate.prototype = {
    _init: function() {
      var self = this;
      this.count = this.$element.data('count') || 0;

      if (this.$element.is('.has-appreciated')) {
        this.$element.find('.js-appreciate-title').html(this.titleAfter);
      }

      this.$template = this.options.template.replace('{count}', this.count);
      this.$template = $(this.$template);
      this.$element.append(this.$template);

      this.$element.click(function() {
        var $t = $(this);
        if ($t.is('.has-appreciated')) {
          return false;
        }

        self.count++;
        self.$element.find('.numbers').html(self.count);
        self.$element.find('.js-appreciate-title').html(this.titleAfter);

        if (self.ajaxurl != undefined) {
          $.post(self.ajaxurl, {
            action: 'appreciate',
            post_id: self.id
          });
        }

        $t.addClass('has-appreciated');
        return false;
      });
    }
  };

  $.fn.appreciate = function(options, callback) {
    this.data('apprecaite', new $.Appreciate(options, this, callback));
    return this;
  };

  /**
   * Utility that allows to detect if element with percentage left / top values
   * (set using style attribute) is out of bounds.
   *
   * Works by storing style values. Calculating position within container.
   * If out of bounds is detected then class out-of-bound-[left|right|top|bottom] is added.
   */
  var PreventOutOfBounds = function($el) {
    this.$el = $el;
    this.$container = $el.parent();
    this.outOfBounds = [];

    this.capturePosition();
    PreventOutOfBounds.registry.push(this);
    if (!PreventOutOfBounds.listening) {
      PreventOutOfBounds.listening = true;
      window.addEventListener(
        'resize',
        _.debounce(PreventOutOfBounds.listen, 300)
      );
    }
    this.update();
  };

  $.fn.preventOutOfBounds = function() {
    return this.each(function() {
      new PreventOutOfBounds($(this));
    });
  };

  PreventOutOfBounds.listening = false;
  PreventOutOfBounds.registry = [];
  PreventOutOfBounds.listen = function() {
    $.each(PreventOutOfBounds.registry, function() {
      this.update();
    });
  };

  PreventOutOfBounds.prototype.capturePosition = function() {
    this.left = parseFloat(this.$el[0].style.left);
    this.right = parseFloat(this.$el[0].style.right);
    this.top = parseFloat(this.$el[0].style.top);
    this.bottom = parseFloat(this.$el[0].style.bottom);
    this.width = parseFloat(this.$el[0].style.width) || 385;
    this.x = 0; // Translate values.
    this.y = 0;

    // Assume center placement if left/right or top/bottom are not present.
    // Centered using top/left and translate.
    if (isNaN(this.left) && isNaN(this.right)) {
      this.left = 50;
      this.x = -50;
    }

    if (isNaN(this.top) && isNaN(this.bottom)) {
      this.top = 50;
      this.y = -50;
    }
  };

  PreventOutOfBounds.prototype.bounds = function() {
    var parentWidth = this.$container.width(),
      parentHeight = this.$container.height(),
      height = parseFloat(this.$el.outerHeight()),
      width = parseFloat(this.$el.outerWidth()),
      x1,
      x2,
      y1,
      y2;

    if (!isNaN(this.left)) {
      // % left position converted into px + translate x value converted into px.
      x1 = Math.ceil((parentWidth * this.left) / 100) + (width * this.x) / 100;
      x2 = x1 + this.width;
    } else if (!isNaN(this.right)) {
      x2 =
        parentWidth -
        Math.ceil((parentWidth * this.right) / 100) +
        (width * this.x) / 100;
      x1 = x2 - this.width;
    } else {
      return false;
    }

    if (!isNaN(this.top)) {
      // % top position converted into px + translate y value converted into px.
      y1 = Math.ceil((parentHeight * this.top) / 100) + (height * this.y) / 100;
      y2 = y1 + height;
    } else if (!isNaN(this.bottom)) {
      y2 =
        parentHeight -
        Math.ceil((parentHeight * this.bottom) / 100) +
        (height * this.y) / 100;
      y1 = y2 - height;
    } else {
      return false;
    }

    return {
      x1: x1,
      x2: x2,
      y1: y1,
      y2: y2,
      height: height
    };
  };

  PreventOutOfBounds.prototype.update = function() {
    var bounds = this.bounds(),
      containerWidth = this.$container.width(),
      containerHeight = this.$container.height(),
      previous = this.outOfBounds,
      current = [];

    if (!bounds) {
      return;
    }

    if (bounds.x1 <= 0) {
      current.push('out-of-bounds--left');

      if (this.width >= containerWidth) {
        current.push('out-of-bounds--right');
      }
    }

    if (bounds.x2 >= containerWidth) {
      current.push('out-of-bounds--right');

      if (this.width >= containerWidth) {
        current.push('out-of-bounds--left');
      }
    }

    if (bounds.y1 <= 0) {
      current.push('out-of-bounds--top');

      if (bounds.height >= containerHeight) {
        current.push('out-of-bounds--bottom');
      }
    }

    if (bounds.y2 >= containerHeight) {
      current.push('out-of-bounds--bottom');

      if (bounds.height >= containerHeight) {
        current.push('out-of-bounds--top');
      }
    }

    var toRemove = _.difference(previous, current),
      toAdd = _.difference(current, previous);

    this.$el.removeClass(toRemove.join(' '));
    this.$el.addClass(toAdd.join(' '));
    this.outOfBounds = current;

    // If there were bound changes then width might have been changed.
    // If that's the case we need to run it again to calculate out of bounds with new width.
    if (toAdd.length > 0) {
      var that = this;
      setTimeout(function() {
        requestAnimationFrame(that.update.bind(that));
      }, 1);
    }
  };

  window.PreventOutOfBounds = PreventOutOfBounds;
})(jQuery, jQuery(window), jQuery(document));

window.determineAspectRatio = (function() {
  /**
   * Finds out <video /> or <iframe /> aspect ratio.
   */
  return function($el) {
    var width, height;
    if ($el.is('video')) {
      width = $el[0].videoWidth;
      height = $el[0].videoHeight;
    } else if ($el.is('iframe')) {
      width = $el.attr('width');
      height = $el.attr('height');
    } else {
      return 16 / 9;
    }

    width = parseInt(width, 10);
    height = parseInt(height, 10);

    if (!isNaN(width) && !isNaN(height) && height !== 0) {
      return width / height;
    } else {
      16 / 9;
    }
  };
})();
