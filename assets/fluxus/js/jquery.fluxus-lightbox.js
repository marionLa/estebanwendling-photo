/**
 * Fluxus Lightbox 2.0
 *
 * Dependencies:
 *     jQuery
 *     underscore debounce
 */
(function ($, debounce) {
  var TOUCH_DEVICE = false;
  var FADE_OUT_DURATION = 300;
  var DEFAULT_OPTIONS = {
    error: 'Unable to load',
    mode: 'fit', // fit or full,
    margin: 15, // Margin around content when in fit mode.
    loadingIndicatorDelay: 800,
    idleTimeout: 5000,
    onHide: function () {},
    // Called on link click. Can return false to cancel
    // opening of the Lightbox.
    onClick: undefined
  };
  var $window = $(window);
  var $html = $('html');

  $window.on('touchstart.fluxus-lightbox', function () {
    TOUCH_DEVICE = true;
    $window.trigger('is-touch-device').off('touchstart.fluxus-lightbox');
  });

  $.FluxusLightbox = function ($links, options) {
    this.$links = $links;
    if (0 === this.$links.length) {
      return false;
    }

    this.options = $.extend({}, DEFAULT_OPTIONS, options);
    this._isModeFullWidth = this.options.mode == 'full';
    this.hdImage = new Image();

    this.render();
    this.bindOnClickListener();

    // Detects touch device and enables gestures.
    if (TOUCH_DEVICE) {
      this.setupGestures();
    } else {
      $window.on(
        'is-touch-device.fluxus-lightbox',
        this.setupGestures.bind(this)
      );
    }
  };

  $.FluxusLightbox.prototype = {
    open: function (event, callback) {
      // Render Lightbox offscreen, prevent overflow.
      $html.addClass('fluxus-lightbox-visible');

      // Store current window size.
      $window.on(
        'resize.fluxus-lightbox',
        debounce(this.storeWindowSize.bind(this))
      );
      this.storeWindowSize();

      // Calculate scroll position and start tracking mouse.
      this._scrollPosition = {
        left: $window.scrollLeft(),
        top: $window.scrollTop()
      };
      event && this.onMouseMove(event);
      $window.on('mousemove.fluxus-lightbox', this.onMouseMove.bind(this));

      if (this._isModeFullWidth) {
        this.toggleFullWidthMode(true);
      }

      // Transition into view.
      onTransitionEnd(
        this.$lightbox,
        function () {
          this.$lightbox.addClass('fluxus-lightbox--transitioned');
        }.bind(this),
        { propertyName: 'transform' }
      );
      this.$lightbox.addClass('fluxus-lightbox--slide-in');

      $window.on(
        'keydown.fluxus-lightbox',
        this.handleKeyboardEvent.bind(this)
      );

      callback && callback.call(this);
    },

    close: function (options) {
      $window.off('.fluxus-lightbox');
      this.$content.css({ transition: '' });

      options = $.extend({}, { animation: true }, options);

      if (!options.animation) {
        this.$lightbox
          .css({ display: 'none', transition: 'none' })
          .removeClass('fluxus-lightbox--transitioned')
          .removeClass('fluxus-lightbox--slide-in');
        this.$lightbox.width();
        $html.removeClass('fluxus-lightbox-visible');
        this.$lightbox.css({ display: '', transition: '' });
        return;
      }

      onTransitionEnd(
        this.$lightbox,
        function () {
          $html.removeClass('fluxus-lightbox-visible');
          var $iframe = this.$media.find('iframe');
          if ($iframe.length) {
            this.$media.html('');
          }
          this.options.onHide && this.options.onHide.call(this);
        }.bind(this),
        { propertyName: 'transform' }
      );

      this.$lightbox
        .removeClass('fluxus-lightbox--transitioned')
        .removeClass('fluxus-lightbox--slide-in');
    },

    _startCloseAnimation: function (callback) {
      onTransitionEnd(this.$lightbox, callback.bind(this), {
        propertyName: 'transform'
      });

      this.$lightbox
        .removeClass('fluxus-lightbox--transitioned')
        .removeClass('fluxus-lightbox--slide-in');
    },

    idleOn: function () {
      this.isIdle = true;
      this.$lightbox.addClass('fluxus-lightbox--idle');
    },

    idleOff: function () {
      this.isIdle = false;
      this.$lightbox.removeClass('fluxus-lightbox--idle');
    },

    onMouseMove: function (event) {
      this.stickTipToCursorOnMouseMove(event);
      this.triggerActivityEvent();
    },

    triggerActivityEvent: function () {
      this.idleOff();
      clearTimeout(this._idleTimeout);
      this._idleTimeout = setTimeout(
        this.idleOn.bind(this),
        this.options.idleTimeout
      );
    },

    stickTipToCursorOnMouseMove: function (event) {
      this._mousePosition = {
        x: event.pageX,
        y: event.pageY
      };
      this.stickTipToCursor();
    },

    stickTipToCursor: function () {
      var x = this._mousePosition.x - this._scrollPosition.left,
        y = this._mousePosition.y - this._scrollPosition.top;

      var middlePoint = this._windowSize.width / 2;
      var rotate;
      if (x > middlePoint) {
        rotate = ' rotate(0)';
      } else {
        rotate = ' rotate(180deg)';
      }

      this.$tip.css('transform', 'translate3d(' + x + 'px, ' + y + 'px, 0)');
      this.$tipIcon.css('transform', rotate);
    },

    handleKeyboardEvent: function (event) {
      if (39 == event.which) {
        event.preventDefault();
        this.next();
      }

      if (37 == event.which) {
        event.preventDefault();
        this.previous();
      }

      if (27 == event.which) {
        event.preventDefault();

        if (this._isModeFullWidth) {
          this.toggleFullWidthMode(false);
        } else {
          this.close();
        }
      }
    },

    loadingStarted: function () {
      this._loadingMessageTimeout = setTimeout(
        function () {
          this.$lightbox.addClass('fluxus-lightbox--long-loading');
        }.bind(this),
        this.options.loadingIndicatorDelay
      );
    },

    loadingFinished: function () {
      clearTimeout(this._loadingMessageTimeout);
      this.$lightbox.removeClass('fluxus-lightbox--long-loading');
    },

    showIframe: function ($iframe, options) {
      this.$lightbox.addClass('fluxus-lightbox--iframe');
      this.$lightbox.removeClass('fluxus-lightbox--error');

      // Show loading.
      this.$media.removeClass('fluxus-lightbox__media--loaded');
      this.loadingStarted();

      // Mark active element.
      this.$links.removeClass('lightbox-active');
      $iframe.addClass('lightbox-active');

      this.$iframe = $iframe.clone().attr('style', '');

      this.$iframe
        .on(
          'error',
          function () {
            this.loadingFinished();
            this.$lightbox.addClass('fluxus-lightbox--error');
          }.bind(this)
        )
        .on(
          'load',
          function () {
            // put iframe in position
            this.resizeIframe();
            this.$media.addClass('fluxus-lightbox__media--loaded');

            $window
              .off('resize.media.fluxus-lightbox')
              .on(
                'resize.media.fluxus-lightbox',
                debounce(this.resizeIframe.bind(this))
              );

            this.loadingFinished();
          }.bind(this)
        );

      // Append contents with iFrame
      this.$iframeWrap = $('<div class="fluxus-lightbox__iframe-wrap" />')
        .on('mousemove.fluxus-lightbox', this.onMouseMoveOverIframe.bind(this))
        .prepend(this.$iframe);

      this.$media.html(this.$iframeWrap);
    },

    /**
     * iFrame captures mouseover events. As a workaround we create an overlay,
     * it captures mouse move and hides itself and navigation tip. When mouse
     * event is captured again we show the overlay.
     *
     * Timeout is needed because window.mousemove event will fire straight away.
     */
    onMouseMoveOverIframe: function () {
      this.$lightbox.addClass('fluxus-lightbox--mouse-over-iframe');
      setTimeout(
        function () {
          $window.one(
            'mousemove.iframe.fluxus-lightbox',
            this.onMouseOutOfIframe.bind(this)
          );
        }.bind(this),
        50
      );
    },

    onMouseOutOfIframe: function () {
      this.$lightbox.removeClass('fluxus-lightbox--mouse-over-iframe');
    },

    resizeIframe: function () {
      var CONTROLS_HEIGHT = 160,
        DEFAULT_RATIO = 16 / 9,
        parentWidth = this._windowSize.width - this.options.margin * 2,
        parentHeight =
          this._windowSize.height - CONTROLS_HEIGHT - this.options.margin * 2,
        height,
        width;

      var parentRatio =
          parentHeight > 0 ? parentWidth / parentHeight : DEFAULT_RATIO,
        iframeRatio;

      if (this.$iframe.attr('width') && this.$iframe.attr('height')) {
        iframeRatio = this.$iframe.attr('width') / this.$iframe.attr('height');
      } else {
        iframeRatio = DEFAULT_RATIO;
      }

      if (iframeRatio > parentRatio) {
        // Fill axis: x
        this.$iframeWrap.css({
          width: parentWidth,
          height: parentWidth / iframeRatio
        });
      } else {
        this.$iframeWrap.css({
          width: parentHeight * iframeRatio,
          height: parentHeight
        });
      }
    },

    showImage: function ($image, options) {
      options = $.extend(
        {
          delay: FADE_OUT_DURATION
        },
        options
      );

      this.$lightbox.removeClass(
        'fluxus-lightbox--iframe fluxus-lightbox--error'
      );
      this.$media.removeClass('fluxus-lightbox__media--loaded');
      this.$links.removeClass('lightbox-active');
      $image.addClass('lightbox-active');

      this._userTransform = { x: 0, y: 0, scale: 1 };
      this.loadingStarted();

      var srcset = $image.attr('srcset');
      if (srcset) {
        srcset = srcset.split(',');
        srcset = srcset[srcset.length - 1]; // For now simply assume last src to have highest resolution.
        srcset = srcset.split(' ');
        this.hdSource = srcset[0];
      } else {
        this.hdSource = null;
      }

      var source =
        $image.attr('href') || $image.attr('src') || $image.data('src');
      var fadeOutAnimation = createTimeoutPromise(options.delay);

      return $.when(this.loadImage(source), fadeOutAnimation)
        .then(
          function (image) {
            this.loadingFinished();
            $window
              .off('resize.media.fluxus-lightbox')
              .on(
                'resize.media.fluxus-lightbox',
                debounce(this.resizeImage.bind(this))
              );

            this.$image = $('<img />').attr({
              src: image.src,
              width: image.width,
              height: image.height
            });
            this.resizeImage();
            this.$media.html(this.$image);
            this.$image[0].offsetHeight;
            this.$media.addClass('fluxus-lightbox__media--loaded');

            // Load HD
            var disableHd = TOUCH_DEVICE;
            if (!disableHd && this.hdSource) {
              // Cancel previous HD load.
              this.hdImage.src =
                'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEAAAAALAAAAAABAAEAAAI=;';
              this.hdImage.onload = function () {
                this.hdImageLoaded(new String(this.hdSource));
              }.bind(this);
              this.hdImage.src = this.hdSource;
            }
          }.bind(this)
        )
        .fail(
          function () {
            this.loadingFinished();
            this.$lightbox.addClass('fluxus-lightbox--error');
          }.bind(this)
        );
    },

    hdImageLoaded: function (originalSource) {
      // Only update image if it has not changed.
      if (this.hdSource == originalSource) {
        this.$image.attr('src', this.hdImage.src);
      }
    },

    /**
     * Calculates images transform and scale values.
     * We only operate on translate values for position.
     * Combining other properties appeared problematic when trying to transition them.
     */
    resizeImage: function () {
      var width = this.$image.attr('width'),
        height = this.$image.attr('height'),
        ratio = width / height,
        parentHeight = this.$media.height(),
        parentWidth = this.$media.width(),
        parentRatio = parentWidth / parentHeight,
        data = {
          height: parseInt(height, 10),
          width: parseInt(width, 10),
          // Which axis fills whole area
          fillAxis: ratio > parentRatio ? 'x' : 'y'
        },
        scaledWidth,
        scaledHeight,
        invertedScale;

      if (!this._isModeFullWidth) {
        // Fit mode has margins. Remove margins from available height.
        parentWidth = parentWidth - this.options.margin * 2;
        parentHeight = parentHeight - this.options.margin * 2;
      }

      if (data.fillAxis == 'x') {
        // Full width, center vertically.
        if (this._isModeFullWidth) {
          data.scale = parentHeight / height;
          data.x = (width * data.scale - parentWidth) / -2;
          data.y = 0;
        } else {
          data.scale = parentWidth / width;
        }
      } else {
        // Full height, center horizontally.
        if (this._isModeFullWidth) {
          data.scale = parentWidth / width;
          data.x = 0;
          data.y = (height * data.scale - parentHeight) / -2;
        } else {
          data.scale = parentHeight / height;
        }
      }

      /**
       * "(parentWidth - scaledWidth) / 2" = move by half the difference between image and container.
       * "+ this.options.margin" = add margin.
       */
      if (!this._isModeFullWidth) {
        scaledWidth = width * data.scale;
        scaledHeight = height * data.scale;
        data.x = (parentWidth - scaledWidth) / 2 + this.options.margin;
        data.y = (parentHeight - scaledHeight) / 2 + this.options.margin;
      }

      this.setImageStyle(data);
    },

    setImageStyle: function (sugarStyle) {
      this._imageStyle = $.extend({}, sugarStyle);
      this.$image.scss(sugarStyle);
    },

    loadImage: function (src) {
      var dfd = new $.Deferred(),
        image = new Image();

      image.onload = function () {
        dfd.resolve(image);
      }.bind(this);

      image.onerror = dfd.reject;
      image.src = src;

      return dfd;
    },

    next: function (options) {
      var activeIndex = this.$links.index(
          this.$links.filter('.lightbox-active')
        ),
        newIndex = 0;

      if (activeIndex != -1 && activeIndex + 1 != this.$links.length) {
        newIndex = activeIndex + 1;
      }

      return this.show(this.$links.eq(newIndex), options);
    },

    previous: function (options) {
      var activeIndex = this.$links.index(
          this.$links.filter('.lightbox-active')
        ),
        newIndex = this.$links.length - 1;

      if (activeIndex !== -1 && activeIndex !== 0) {
        newIndex = activeIndex - 1;
      }

      return this.show(this.$links.eq(newIndex), options);
    },

    show: function ($item, options) {
      var method = $item.is('iframe') ? 'showIframe' : 'showImage';
      return this[method]($item, options);
    },

    bindOnClickListener: function () {
      this.$links.filter(':not(iframe)').on(
        'click.fluxus-lightbox',
        function (event) {
          event.preventDefault();
          if (this.options.onClick && this.options.onClick(event) === false) {
            return;
          }
          this.showImage($(event.currentTarget));
          this.open(event, this.options.onShow);
        }.bind(this)
      );
    },

    render: function () {
      var that = this,
        template =
          '' +
          '<div class="fluxus-lightbox">' +
          '<div class="fluxus-lightbox__content">' +
          '<div class="fluxus-lightbox__media"></div>' +
          '</div>' +
          '<div class="fluxus-lightbox__tip"><div class="fluxus-lightbox__tip-icon"></div></div>' +
          '<div class="fluxus-lightbox__top-right">' +
          '<span class="fluxus-lightbox__btn fluxus-lightbox__btn--close icon-close-slim"></span>' +
          '</div>' +
          '<div class="fluxus-lightbox__bottom-right">' +
          '<span class="fluxus-lightbox__btn fluxus-lightbox__btn--resize">' +
          '<span class="icon-zoom-in-slim"></span>' +
          '<span class="icon-zoom-out-slim"></span>' +
          '</span>' +
          '<span class="fluxus-lightbox__btn fluxus-lightbox__btn--previous icon-previous-slim-arrow"></span>' +
          '<span class="fluxus-lightbox__btn fluxus-lightbox__btn--next icon-next-slim-arrow"></span>' +
          '</div>' +
          '<div class="fluxus-lightbox__status"></div>' +
          '<div class="fluxus-lightbox__error">' +
          this.options.error +
          '</div>' +
          '</div>';

      this.$lightbox = $(template);
      if (this.$links.length == 1) {
        this.$lightbox.addClass('fluxus-lightbox--single');
      }
      this.$content = this.$lightbox.find('.fluxus-lightbox__content');
      this.$media = this.$lightbox.find('.fluxus-lightbox__media');
      this.$tip = this.$lightbox.find('.fluxus-lightbox__tip');
      this.$tipIcon = this.$lightbox.find('.fluxus-lightbox__tip-icon');

      this.$lightbox
        .find('.fluxus-lightbox__top-right, .fluxus-lightbox__bottom-right')
        .on('mouseenter mouseleave', this.onMouseHoverControls.bind(this));

      /**
       * Assign DOM events
       */
      this.$next = this.$lightbox
        .on('click', '.fluxus-lightbox__btn--next', function (e) {
          that.next.call(that);
          e && e.preventDefault();
        })
        .find('.fluxus-lightbox__btn--next');

      this.$previous = this.$lightbox
        .on('click', '.fluxus-lightbox__btn--previous', function (e) {
          that.previous.call(that);
          e && e.preventDefault();
        })
        .find('.fluxus-lightbox__btn--previous');

      this.$close = this.$lightbox
        .on('click', '.fluxus-lightbox__btn--close', function (e) {
          that.close.call(that);
          e && e.preventDefault();
        })
        .find('.fluxus-lightbox__btn--close');

      this.$resize = this.$lightbox
        .on('click', '.fluxus-lightbox__btn--resize', function (event) {
          event && event.preventDefault();
          that.toggleFullWidthMode(!that._isModeFullWidth);
        })
        .find('.fluxus-lightbox__btn--resize');
      this.$lightbox.toggleClass(
        'fluxus-lightbox--full-width',
        this.options.mode === 'fill'
      );

      if (this.$links.length > 1) {
        this.$content.on('click', this.onAreaClick.bind(this));
      }

      $('body').append(this.$lightbox);
    },

    toggleFullWidthMode: function (on) {
      this._isModeFullWidth = on;
      // resizeImage calculates width that depends on .fluxus-lightbox--full-width
      // therefore order of execution is important.
      this.$lightbox.toggleClass('fluxus-lightbox--full-width', on);
      this.resizeImage();
      if (on) {
        $window
          .off('mousemove.pan.fluxus-lightbox')
          .on(
            'mousemove.pan.fluxus-lightbox',
            this.panImageOnMouseMove.bind(this)
          );
      } else {
        $window.off('mousemove.pan.fluxus-lightbox');
      }
    },

    onAreaClick: function (event) {
      if (!TOUCH_DEVICE) {
        var x = event.pageX - this._scrollPosition.left,
          y = event.pageY - this._scrollPosition.top,
          middlePoint = this._windowSize.width / 2;

        if (x > middlePoint) {
          this.next();
        } else {
          this.previous();
        }
      }
    },

    panImageOnMouseMove: function (event) {
      var previousImageStyle = this._imageStyle;

      if (previousImageStyle.fillAxis == 'x') {
        var offscreenWidth =
            previousImageStyle.width * previousImageStyle.scale -
            this._windowSize.width,
          panRatio = offscreenWidth / this._windowSize.width;

        previousImageStyle.x =
          -(event.pageX - this.$media.offset().left) * panRatio;
      } else {
        var offscreenHeight =
            previousImageStyle.height * previousImageStyle.scale -
            this._windowSize.height,
          panRatio = offscreenHeight / this._windowSize.height;

        previousImageStyle.y =
          -(event.pageY - this.$media.offset().top) * panRatio;
      }

      this.setImageStyle(previousImageStyle);
    },

    onMouseHoverControls: function (event) {
      this.$lightbox.toggleClass(
        'fluxus-lightbox--over-controls',
        event.type == 'mouseenter'
      );
    },

    storeWindowSize: function () {
      this._windowSize = {
        width: $window.width(),
        height: $window.height()
      };
    },

    setupGestures: function () {
      this.$lightbox.addClass('fluxus-lightbox--touch');
      var enableIfNotPinchingAndNotZoomedIn = function () {
        return (
          !this._isPinching &&
          (!this._userTransform || this._userTransform.scale == 1)
        );
      }.bind(this);

      var horizontalPan = new Hammer.Pan({
        event: 'horizontalPan',
        direction: Hammer.DIRECTION_HORIZONTAL,
        enable: enableIfNotPinchingAndNotZoomedIn
      });
      var verticalPan = new Hammer.Pan({
        event: 'verticalPan',
        direction: Hammer.DIRECTION_VERTICAL,
        enable: enableIfNotPinchingAndNotZoomedIn
      });
      var pan = new Hammer.Pan({
        enable: function () {
          return (
            !this._isPinching &&
            this._userTransform &&
            this._userTransform.scale > 1
          );
        }.bind(this)
      });
      var pinch = new Hammer.Pinch();
      var singleTap = new Hammer.Tap({ event: 'singleTap' });
      var doubleTap = new Hammer.Tap({ event: 'doubleTap', taps: 2 });

      var manager = new Hammer.Manager(this.$lightbox[0]);
      manager.add([
        horizontalPan,
        verticalPan,
        pan,
        pinch,
        doubleTap,
        singleTap
      ]);

      // See http://hammerjs.github.io/require-failure/
      doubleTap.recognizeWith(singleTap);
      singleTap.requireFailure(doubleTap);

      manager.on('horizontalPanstart', this.onHorizontalPanStart.bind(this));
      manager.on('horizontalPanend', this.onHorizontalPanEnd.bind(this));
      manager.on('horizontalPan', this.onHorizontalPan.bind(this));

      manager.on('verticalPanstart', this.onVerticalPanStart.bind(this));
      manager.on('verticalPanend', this.onVerticalPanEnd.bind(this));
      manager.on('verticalPan', this.onVerticalPan.bind(this));

      manager.on('pan', this.onPan.bind(this));
      manager.on('panend', this.onPanEnd.bind(this));

      manager.on('pinchstart', this.onPinchStart.bind(this));
      manager.on('pinch pinchend pinchstart', this.onPinching.bind(this));
      manager.on('pinchend', this.onPinchEnd.bind(this));

      manager.on('singleTap', this.onSingleTap.bind(this));
      manager.on('doubleTap', this.onDoubleTap.bind(this));
    },

    onVerticalPanStart: function () {
      this.$content.css('transition', 'none');
    },

    onVerticalPanEnd: function (event) {
      this.$lightbox.addClass('fluxus-lightbox--bounce-back-transition');
      this.$lightbox.css({ transition: '' });
      this.$lightbox.width();

      var MIN_DISTANCE = 200;

      // Come back to place.
      if (event.distance < MIN_DISTANCE) {
        onTransitionEnd(
          this.$lightbox,
          function () {
            this.$lightbox.removeClass(
              'fluxus-lightbox--bounce-back-transition'
            );
          }.bind(this)
        );
        this.$lightbox.scss({ y: 0, opacity: 1 });
        return;
      }

      var direction = event.deltaY > 0 ? 1 : -1;
      var endY = screen.height * direction;
      onTransitionEnd(
        this.$lightbox,
        function () {
          this.close({ animation: false });
          this.$lightbox
            .scss({ x: '', y: '' })
            .removeClass('fluxus-lightbox--bounce-back-transition');
        }.bind(this),
        { propertyName: 'transform' }
      );
      this.$lightbox.scss({ y: endY });
    },

    onVerticalPan: function (event) {
      this.$lightbox.scss({
        y: event.deltaY,
        transition: 'none'
      });
    },

    animateUserTransform: function (destination) {
      var delta = {
        x: destination.x - this._userTransform.x,
        y: destination.y - this._userTransform.y,
        scale: destination.scale - this._userTransform.scale
      };

      if (!delta.x && !delta.y && !delta.scale) {
        return;
      }

      var initialTransform = $.extend({}, this._userTransform);
      var time = {
        start: performance.now(),
        total: 300
      };
      var animate = function (now) {
        time.elapsed = now - time.start;
        var progress = time.elapsed / time.total;
        progress = progress > 1 ? 1 : progress;

        this._userTransform.scale =
          initialTransform.scale + progress * delta.scale;
        this._userTransform.x = initialTransform.x + progress * delta.x;
        this._userTransform.y = initialTransform.y + progress * delta.y;
        this.$media.scss(this._userTransform);

        progress < 1 && requestAnimationFrame(animate);
      }.bind(this);

      requestAnimationFrame(animate);
    },

    startTransformConstraintAnimation: function () {
      // Scale
      var MAX_SCALE = 3;
      var MIN_SCALE = 1;
      var normalizedTransform = $.extend({}, this._userTransform);

      if (normalizedTransform.scale > MAX_SCALE) {
        normalizedTransform.scale = MAX_SCALE;
      } else if (normalizedTransform.scale < MIN_SCALE) {
        normalizedTransform.scale = MIN_SCALE;
      }

      // X
      var mediaWidth = this._imageStyle.width * this._imageStyle.scale;
      // When scale is 1 we use fit mode with margin, thus mediaWidth
      // when scale is zoomed in we use whole viewport what is this.$media.width()
      var viewportWidth =
        normalizedTransform.scale == 1 ? mediaWidth : this.$media.width();
      var scaledMediaWidth = mediaWidth * normalizedTransform.scale;
      var boundingX = Math.abs(scaledMediaWidth - viewportWidth) / 2;

      if (normalizedTransform.x < boundingX * -1) {
        normalizedTransform.x = boundingX * -1;
      } else if (normalizedTransform.x > boundingX) {
        normalizedTransform.x = boundingX;
      }

      // Y
      var mediaHeight = this._imageStyle.height * this._imageStyle.scale;
      // When scale is 1 we use fit mode with margin, thus mediaHeight
      // when scale is zoomed in we use whole viewport what is this.$media.height()
      var viewportHeight =
        normalizedTransform.scale == 1 ? mediaHeight : this.$media.height();
      var scaledMediaHeight = mediaHeight * normalizedTransform.scale;
      var boundingY = Math.abs(scaledMediaHeight - viewportHeight) / 2;

      if (normalizedTransform.y < boundingY * -1) {
        normalizedTransform.y = boundingY * -1;
      } else if (normalizedTransform.y > boundingY) {
        normalizedTransform.y = boundingY;
      }

      this.animateUserTransform(normalizedTransform);
    },

    onHorizontalPanStart: function (event) {
      this.$content.css('transition', 'none');
    },

    onHorizontalPanEnd: function (event) {
      var $content = this.$content;
      var MIN_PAN_DISTANCE = 100;
      var limitAnimationDuration = function (duration) {
        if (duration < 100) {
          return 100;
        }

        if (duration > 600) {
          return 600;
        }

        return duration;
      };
      var pxPerMillisecond = Math.abs(event.overallVelocityX);
      var LINEAR_TRANSITION = 'transform %dms linear';
      var EASE_OUT_TRANSITION =
        'transform %dms cubic-bezier(.165, .84, .44, 1)';

      // Come back to place.
      if (event.distance < MIN_PAN_DISTANCE) {
        var comebackDuration = Math.abs(event.distance) / pxPerMillisecond;
        comebackDuration = limitAnimationDuration(comebackDuration);
        $content.css({
          transition: EASE_OUT_TRANSITION.replace('%d', comebackDuration)
        });
        $content.scss({ x: 0 });
        return;
      }

      var distanceToGo = $content.width() - Math.abs(event.distance);
      var swipeoutDuration = distanceToGo / pxPerMillisecond;
      swipeoutDuration = limitAnimationDuration(swipeoutDuration);
      $content.css(
        'transition',
        LINEAR_TRANSITION.replace('%d', swipeoutDuration)
      );

      var panDirection = event.deltaX > 0 ? 'previous' : 'next';
      var panDirectionModifier = panDirection == 'previous' ? 1 : -1;

      $content.scss({ x: toCssPercent(100 * panDirectionModifier) });

      setTimeout(
        function () {
          this[panDirection]({ delay: 0 }).then(function () {
            $content.css('transition', 'none');
            $content
              .scss({ x: toCssPercent(-100 * panDirectionModifier) })
              .width();
            var duration = $content.width() / pxPerMillisecond;
            duration = limitAnimationDuration(duration);
            $content.css({
              transition: EASE_OUT_TRANSITION.replace('%d', duration)
            });
            $content.scss({ x: 0 });
          });
        }.bind(this),
        swipeoutDuration
      );
    },

    onHorizontalPan: function (event) {
      this.$content.scss({ x: event.deltaX });
    },

    onPan: function (event) {
      var currentTransform = $.extend({}, this._userTransform, {
        x: this._userTransform.x + event.deltaX,
        y: this._userTransform.y + event.deltaY
      });
      this.$media.scss(currentTransform);
    },

    onPanEnd: function (event) {
      this._userTransform.x = this._userTransform.x + event.deltaX;
      this._userTransform.y = this._userTransform.y + event.deltaY;
      this.startTransformConstraintAnimation();
    },

    onSingleTap: function (event) {
      this.$lightbox.addClass('fluxus-lightbox--after-tap');
      if (this.isIdle) {
        this.triggerActivityEvent();
      } else {
        this.idleOn();
      }
      setTimeout(
        function () {
          this.$lightbox.removeClass('fluxus-lightbox--after-tap');
        }.bind(this),
        1000
      );
    },

    onDoubleTap: function () {
      var zoomIn = this._userTransform.scale == 1;
      var transform = $.extend({}, this._userTransform, {
        scale: this._userTransform.scale == 1 ? 2 : 1
      });
      if (!zoomIn) {
        transform.x = 0;
        transform.y = 0;
      }
      this.animateUserTransform(transform);
    },

    onPinchStart: function (event) {
      this._isPinching = true;
    },

    onPinchEnd: function (event) {
      this._userTransform.scale = this._userTransform.scale * event.scale;
      this.startTransformConstraintAnimation();
      setTimeout(
        function () {
          this._isPinching = false;
        }.bind(this),
        300
      );
    },

    onPinching: function (event) {
      event.preventDefault();
      var currentTransform = $.extend({}, this._userTransform, {
        scale: this._userTransform.scale * event.scale
      });
      this.$media.scss(currentTransform);
    }
  };

  $.fn.fluxusLightbox = function (options) {
    return this.data('fluxus-lightbox', new $.FluxusLightbox(this, options));
  };

  /**
   * Utils
   */
  var cssFromSugar = function (sugar) {
    sugar = $.extend({}, sugar);

    var transform = [],
      numberWithotSuffix = /^\-?\d+(\.\d+)?$/;

    if (sugar.x == '' && sugar.y == '') {
      // Explicitly remove transform.
    } else if (sugar.x !== void 0 || sugar.y !== void 0) {
      sugar.x = sugar.x ? sugar.x : 0;
      sugar.x = String(sugar.x).match(numberWithotSuffix)
        ? sugar.x + 'px'
        : sugar.x;
      sugar.y = sugar.y ? sugar.y : 0;
      sugar.y = String(sugar.y).match(numberWithotSuffix)
        ? sugar.y + 'px'
        : sugar.y;

      transform.push('translate3d(' + sugar.x + ', ' + sugar.y + ', 0)');
    } else {
      transform.push('translate3d(0, 0, 0)');
    }

    if (sugar.scale !== void 0) {
      transform.push('scale(' + sugar.scale + ')');
    }

    sugar['transform'] = transform.join(' ');
    sugar['-webkit-transform'] = sugar['transform'];

    // Remove blacklisted props.
    delete sugar.x;
    delete sugar.y;
    delete sugar.scale;
    delete sugar.fillAxis;
    return sugar;
  };

  var createTimeoutPromise = function (delay) {
    var dfd = new $.Deferred();
    setTimeout(dfd.resolve.bind(this), delay);
    return dfd;
  };

  var toCssPercent = function (numer) {
    return String(numer) + '%';
  };

  /**
   * Utility for tracking transitionend event.
   *   once: Boolean - will unbind after first event.
   *   propertyName: String - will trigger only on specific properties.
   */
  var onTransitionEnd = (function () {
    var index = 0;
    var uuid = function () {
      return 'lightbox-event-' + index++;
    };

    return function ($el, callback, options) {
      options = $.extend(
        {},
        {
          once: true,
          propertyName: undefined,
          captureBubbledEvents: false
        },
        options
      );

      var namespace = uuid();
      var events =
        'transitionend.' + namespace + ' webkitTransitionEnd.' + namespace;

      $el.on(events, function (event) {
        var matchesPropertyName =
          options.propertyName &&
          event.originalEvent.propertyName == options.propertyName;

        var matchesTarget =
          !options.captureBubbledEvents && event.originalEvent.target == $el[0];

        if (matchesPropertyName && matchesTarget) {
          callback.call(this, event.originalEvent.srcElement);
          options && options.once && $el.off(events);
        }
      });
    };
  })();

  $.fn.scss = function (sugar) {
    return this.css(cssFromSugar(sugar));
  };
})(jQuery, _.debounce);
