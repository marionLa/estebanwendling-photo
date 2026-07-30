(function($, determineAspectRatio) {
  var VideoMedia = function(_$el) {
    var that = this;
    this.$el = _$el;
    this.aspectRatioReady = new $.Deferred();
    this.isPlaying = new $.Deferred();

    this.player = new Plyr(
      this.$el.find('.js-player'),
      VideoMedia.PLYR_OPTIONS
    );

    $.when(this.isPlaying).then(function() {
      // Plyr volume / mute option won't work with embed videos. Need to setup manually.
      that.player.volume = 0;

      // Hide native controls on iOS.
      if (!that.player.isEmbed) {
        that.$el.find('video').removeAttr('controls');
      }

      // It is safe to calculate aspect ratio.
      that.aspectRatioReady.resolve();
    });

    this.resolveIsPlaying = function(event) {
      /**
       * Vimeo emits 'playing' event even when playing has not started.
       * This results in vimeo-based loading screen. To avoid it we
       * wait for Vimeo to emit first 'progress' event. This way we now
       * that playback has truly started.
       */
      if (this.player.provider === 'vimeo') {
        if (event.type === 'progress') {
          this.isPlaying.resolve();
          this.player.off('playing progress', this.resolveIsPlaying);
        }
      } else {
        if (event.type === 'playing') {
          this.isPlaying.resolve();
          this.player.off('playing progress', this.resolveIsPlaying);
        }
      }
    }.bind(this);

    this.player.on('playing progress', this.resolveIsPlaying);
  };

  VideoMedia.prototype.getAspectRatio = function() {
    var $media = this.$el
      .find(this.player.isEmbed ? 'iframe' : 'video')
      .first();

    return determineAspectRatio($media);
  };

  VideoMedia.PLYR_OPTIONS = {
    // debug: true,
    controls: [],
    loadSprite: false, // We are not using UI so don't need to load sprite.
    autoplay: true,
    loop: { active: true },
    volume: 0,
    muted: true,
    clickToPlay: false,
    disableContextMenu: false,
    keyboard: { focused: false, global: false },
    settings: []
  };

  var EmbedMedia = function(_$el) {
    this.$el = _$el;
    this.aspectRatioReady = new $.Deferred().resolve();
  };

  EmbedMedia.prototype.getAspectRatio = function() {
    return determineAspectRatio(this.$el.find('iframe'));
  };

  var ImageMedia = function(_$el) {
    this.$el = _$el;
    this.aspectRatioReady = new $.Deferred().resolve();
  };

  ImageMedia.prototype.getAspectRatio = function() {
    var aspect = parseInt(this.$el.data('aspect'));
    if (!isNaN(aspect)) {
      return aspect;
    }
  };

  var Slide = function(_el) {
    this.$el = $(_el);
    this.$el.data('slide', this);
    this.type = this.$el.data('type');
    this.$contentBox = this.$el.find('.content-box').preventOutOfBounds();

    var isPlayerMedia = this.type == 'embed' || this.type == 'video';
    var isPlayerRawEmbed = this.type == 'raw-embed';

    if (isPlayerMedia) {
      this.media = new VideoMedia(this.$el);
    } else if (isPlayerRawEmbed) {
      this.media = new EmbedMedia(this.$el);
    } else {
      this.media = new ImageMedia(this.$el);
    }

    $.when(this.media.aspectRatioReady).then(
      function() {
        var aspect = this.media.getAspectRatio();
        this.$el.data('aspect', aspect || 16 / 9);
        if (isPlayerMedia || isPlayerRawEmbed) {
          this.setupAspectImage(aspect);
        }
        window.addEventListener(
          'resize',
          _.debounce(this.onWindowResize, 500).bind(this),
          { passive: true }
        );

        // Call resize event on initial load to set some values.
        // We need 100ms timeout and do it again because sometimes Chrome is
        // reporting wrong height of .content-box__contents
        this.onWindowResize();
        setTimeout(this.onWindowResize.bind(this), 100);
      }.bind(this)
    );

    $.when(this.media.isPlaying).then(
      function() {
        if (this.type !== 'image') {
          setTimeout(
            function() {
              this.$el.addClass('swiper-slide--video-playing');
            }.bind(this),
            500
          );
        }
      }.bind(this)
    );
  };

  Slide.prototype.onWindowResize = function() {
    var containerHeight = this.$el.outerHeight();
    var contentHeight = this.$el.find('.content-box__contents').outerHeight();
    var mediaAspect = parseFloat(this.$el.attr('data-aspect'));
    if (isNaN(mediaAspect)) {
      mediaAspect = this.$el.data('aspect') || 16 / 9;
    }
    var containerWiderThanMedia =
      this.$el.outerWidth() / containerHeight >= mediaAspect;
    this.$el.toggleClass(classNames.WIDE, containerWiderThanMedia);

    var contentTallerThanContainer = contentHeight > containerHeight;
    var isDraggable = this.$contentBox.is('.ui-draggable');

    if (contentTallerThanContainer && !isDraggable) {
      this.iscroll =
        this.iscroll ||
        new IScroll(this.$contentBox.get(0), {
          mouseWheel: true,
          eventPassthrough: 'horizontal',
          scrollbars: 'custom',
          interactiveScrollbars: true
        });

      this.iscroll.refresh();
    }
  };

  Slide.prototype.setupAspectImage = function(aspect) {
    // Default aspect image 16:9 is already in HTML.
    if (!aspect) {
      return;
    }

    /**
     * We need to resize container and keep aspect ratio:
     *   a) width: auto; height: 100%
     *   b) width: 100%; height: auto
     * There CSS only solution for b (using percentage based padding),
     * but no CSS only solution for a. We solve it by using a simple image.
     * However at times video aspect ratio can be not 16:9, thus we create an image dynamically.
     */
    var canvas = document.createElement('canvas');
    canvas.width = 1500;
    canvas.height = canvas.width / aspect;
    this.$el
      .find('.swiper-slide__aspect-image')
      .attr('src', canvas.toDataURL('image/png'));
  };

  var classNames = {
    AUTOPLAYING: 'swiper-pagination-bullets--autoplaying',
    SLIDE: 'swiper-slide',
    WIDE: 'swiper-slide--wide'
  };

  /**
   * Configures various Swiper options.
   */
  var FluxusSwiperFactory = function($el, _options) {
    this.options = _options || {};
    this.$el = $el;
    this.autoplayDelay = parseInt(this.$el.data('autoplay'));

    var that = this;
    var $slides = $el.find('.' + classNames.SLIDE);
    var slidesCount = $slides.length;
    var slidesPerView = 1;
    var isMultiplePages = slidesCount / slidesPerView > 1;
    // Loop only if there are not media slides. This is because Swiper
    // duplicates DOM, which takes time for video components and causes
    // them to be out of sync.
    var loop =
      $el.find(
        '.swiper-slide--video, .swiper-slide--embed, .swiper-slide--raw-embed'
      ).length == 0;
    var events = {
      lazyImageReady: that.slideReady.bind(that),

      autoplayStart: function() {
        this.el.classList.add(classNames.AUTOPLAYING);
      },

      autoplayStop: function() {
        this.el.classList.remove(classNames.AUTOPLAYING);
      },

      slideChangeTransitionStart: function() {
        // Manually detect bounce back transition.
        var $currentSlide = $(this.slides)
          .filter('.swiper-slide--current')
          .first();
        var isBounceBackTransition =
          this.slides[this.activeIndex] == $currentSlide[0];
        if (isBounceBackTransition) {
          return;
        }

        this.params.pagination &&
          this.autoplay.running &&
          that.markPreviouslyActiveBullet.call(this);

        this.slides.removeClass('swiper-slide--current');
        this.slides[this.activeIndex].classList.add('swiper-slide--current');
      },

      slideChangeTransitionEnd: function() {
        if (this.params.pagination) {
          var endedClass = 'after-transition';
          var that = this;
          this.pagination.bullets.each(function(index, el) {
            el.classList.remove(endedClass);
            if (
              el.classList.contains(that.params.pagination.bulletActiveClass)
            ) {
              el.classList.add(endedClass);
            }
          });
        }

        // Mark previous items based on activeIndex.
        for (var i = 0; i <= this.slides.length - 1; i++) {
          if (i < this.activeIndex) {
            this.slides[i].classList.add('swiper-slide--prev');
          } else {
            this.slides[i].classList.remove('swiper-slide--prev');
          }
        }
      }
    };

    if (this.options.restartVideosBeforeShow) {
      events.touchStart = function() {
        var $nextSlide = $(this.slides[this.activeIndex + 1]);
        var $previousSlide = $(this.slides[this.activeIndex - 1]);

        [$nextSlide, $previousSlide].forEach(function($slide) {
          if ($slide.length) {
            var slide = $slide.data('slide');
            if (slide.type === 'video') {
              slide.media.player.restart();
            }
          }
        });
      };
    }

    var swiperOptions = {
      preloadImages: false,
      spaceBetween: 15,
      speed: 1000,
      loop: loop,
      shortSwipes: false,
      longSwipesRatio: 0.3,
      longSwipesMs: 100,
      effect: $el.data('effect'),
      slidesPerView: slidesPerView,
      runCallbacksOnInit: false,
      keyboard: true,
      on: events,
      lazy: {
        loadPrevNext: true, // Load closest slides.
        loadPrevNextAmount: 4, // Amount of closest slides to load.
        preloaderClass: 'fluxus-loading' // Loading indicator class, removed by Swiper, when loaded.
      },
      navigation: {
        nextEl: '.slider-button-next',
        prevEl: '.slider-button-prev'
      },
      pagination: {
        el: '.swiper-pagination-bullets',
        clickable: true,
        renderBullet: function(bulletIndex, classNames) {
          var index = bulletIndex * this.params.slidesPerGroup;
          if (this.params.loop) {
            index = index + this.loopedSlides;
          }
          var title = this.slides[index].dataset.title;
          var circleStyle =
            'animation-duration: ' +
            (this.params.speed + that.autoplayDelay) +
            'ms; ';

          // Radius: 5; Stroke: 1.5; Viewbox: {Radius} * 2 + {Stroke}; x1: -{Stroke} / 2; y1: -{Stroke} / 2;
          // x2: {Viewbox}; y2: {Viewbox}; Dasharray: 2 * PI * {Radius}
          var svg =
            '<svg viewBox="-1 -1 12 12" xmlns="http://www.w3.org/2000/svg">' +
            '<circle class="double-circle__bottom" fill="none" stroke="#ffffff" stroke-width="1.5" stroke-dasharray="32" stroke-dashoffset="0" cx="5" cy="5" r="5" transform="translate(5, 5) rotate(-90.000000) translate(-5, -5)"></circle>' +
            '<circle class="double-circle__top" style="' +
            circleStyle +
            '" fill="none" stroke="#fff222" stroke-width="1.5" stroke-dasharray="32" stroke-dashoffset="32" cx="5" cy="5" r="5" transform="translate(5, 5) rotate(-90.000000) translate(-5, -5)"></circle>' +
            '</svg>';

          return (
            '<li class="' +
            classNames +
            ' after-transition">' +
            svg +
            '<span class="swiper-pagination-bullets__tip">' +
            (title || '') +
            '</span></li>'
          );
        }
      }
    };

    if ($el.data('pagination') === undefined) {
      swiperOptions.pagination = false;
    }

    if ($el.data('navigation-arrows') === undefined) {
      swiperOptions.navigation = false;
    }

    if (!isMultiplePages) {
      swiperOptions.autoplay = false;
      swiperOptions.loop = false;
      swiperOptions.simulateTouch = false;
      swiperOptions.pagination = false;
    }

    this.swiper = new Swiper($el, swiperOptions);

    if (loop) {
      // Update $slides with slides that were created by Swiper.
      $slides = $el.find('.' + classNames.SLIDE);
    }

    $slides.each(function() {
      var slideEl = this;
      var slide = new Slide(slideEl);
      $.when(slide.ready).then(function() {
        that.slideReady(slideEl);
      });
    });
  };

  // Used to apply CSS cool-down effect to previously active bullet.
  FluxusSwiperFactory.prototype.markPreviouslyActiveBullet = function() {
    var previouslyActiveClass = 'swiper-pagination-bullet-previously-active';

    this.pagination.bullets.removeClass(previouslyActiveClass);

    var praviouslyActiveBullet = this.pagination.bullets[
      this.previousIndex - (this.loopedSlides || 0)
    ];
    if (praviouslyActiveBullet) {
      praviouslyActiveBullet.classList.add(previouslyActiveClass);
    }
  };

  FluxusSwiperFactory.prototype.slideReady = function(slide) {
    if (!this._initialSlideLoaded) {
      var slideIndex = 0;
      while (slideIndex < this.swiper.slides.length) {
        if (this.swiper.slides[slideIndex] == slide) {
          break;
        }
        slideIndex++;
      }

      var initialIndex =
        this.swiper.params.initialSlide + (this.swiper.loopedSlides || 0);
      slideIndex == initialIndex && this.initialSlideReady(slide);
    }
    slide.classList.add('swiper-slide--loaded');
  };

  FluxusSwiperFactory.prototype.initialSlideReady = function(slide) {
    this._initialSlideLoaded = true;

    this.$el.addClass('swiper-container--ready');

    var that = this;
    setTimeout(function() {
      that.$el.addClass('swiper-container--animated');
    }, 3000);

    // We want to start autoplay after everything is loaded,
    // thus we're not using setting autoplay using Swiper initialization options.
    if (this.autoplayDelay) {
      setTimeout(function() {
        // Autoplay duration is X = <transition length> + <delay>.
        // CSS is set to play animation that takes X.
        // On first slide we are not doing transition, to make CSS sync we increase
        // first slide's delay by speed. And then reduce it.
        that.swiper.params.autoplay.delay =
          that.autoplayDelay + that.swiper.params.speed;
        that.swiper.autoplay.start();
        setTimeout(function() {
          that.swiper.params.autoplay.delay = that.autoplayDelay;
        }, 100);
      }, 500);
    }
  };

  $(function() {
    $('.js-slider').each(function() {
      new FluxusSwiperFactory($(this), {
        restartVideosBeforeShow: false
      });
    });
  });
})(jQuery, window.determineAspectRatio);
