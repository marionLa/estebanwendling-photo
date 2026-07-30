(function ($, helpers) {
  $(function () {
    // --------------------------------------------------------------------
    // 1. Setup Variables
    // --------------------------------------------------------------------

    var $window = $(window),
      $html = $('html'),
      $main = $('#main'),
      $header = $('.js-site-header'),
      $footer = $('.js-site-footer'),
      isLayoutHorizontal = $html.is('.horizontal-page'),
      isLayoutWithoutScroll = isLayoutHorizontal && $html.is('.no-scroll'),
      isLayoutHorizontalVertical = function () {
        return isLayoutHorizontal && $window.width() <= 768;
      };

    // --------------------------------------------------------------------
    // 2. Setup plugins
    // --------------------------------------------------------------------

    // Improves click response on mobile devices.
    // We Need to check if it's loaded because sometimes it gets blocked by uBlock
    window.FastClick && window.FastClick.attach(document.body);

    //
    // Setup navigation helpers.
    //
    // globalNavigation provides ability to scroll content with keyboard
    // arrows, mouse wheel and simple API calls used by .js-nav-tip.
    //
    window.globalNavigation = (function () {
      var flashClassOnHtml = function (className) {
        $('html').addClass(className);
        setTimeout(function () {
          $('html').removeClass(className);
        }, 100);
      };

      var nav = new Navigation({
        onNextItem: function () {
          flashClassOnHtml('global-navigation-on-next');
        },
        onPreviousItem: function () {
          flashClassOnHtml('global-navigation-on-prev');
        },
        onActive: function () {
          $('.js-nav-tip').addClass('nav-tip--visible');
        },
        onInactive: function () {
          $('.js-nav-tip').removeClass('nav-tip--visible');
        }
      });

      $('.js-nav-tip__next').click(nav.nextItem);
      $('.js-nav-tip__prev').click(nav.previousItem);
      nav.setItems($('.js-global-nav-item'));

      return nav;
    })();

    // Appreciate project plugin
    $('.js-btn-appreciate').appreciate();

    // Fluxus Lightbox
    $('.js-link-to-image, .gallery--link-to-file a').fluxusLightbox();

    //
    // Sharrre plugin
    //
    var getSharrreOptions = function ($el) {
      var options = {
        services: $el.data('services'),
        buttonsTitle: $el.data('buttons-title') || ''
      };

      // Turn array into Object with structure { [socialNetwork: string]: true }
      options.services = _.object(
        _.map(options.services.split(','), function (service) {
          return [service, true];
        })
      );
      return options;
    };

    helpers.runIfFound($('.js-share-footer'), function ($el) {
      var options = getSharrreOptions($el),
        buttonsTemplate;

      if (options.buttonsTitle) {
        buttonsTemplate =
          '<div class="share-widget__title">' +
          options.buttonsTitle +
          '<a href="#" class="share-widget__close close"></a>' +
          '</div>';
      }

      $el.sharrre({
        share: options.services,
        buttonsTemplate: buttonsTemplate,
        template: '<b class="share">{title}</b>',
        render: function (self, options) {
          var html = this.template.replace('{title}', options.title);
          $(self.element).html(html);
          $el.show();
        }
      });
    });

    helpers.runIfFound($('#sharrre-project'), function ($el) {
      var options = getSharrreOptions($el),
        buttonsTemplate;

      if (options.buttonsTitle) {
        buttonsTemplate =
          '<div class="arrow"></div><div class="share-widget__title">' +
          options.buttonsTitle +
          '<a href="#" class="share-widget__close close"></a></div>';
      }

      $el.sharrre({
        share: options.services,
        buttonsTemplate: buttonsTemplate,
        enableCounter: options.enableCounter,
        template:
          '<span class="icon"></span><div class="box">' +
          '<a class="share" href="#">{title}</a>' +
          '</div>',
        render: function (self, options) {
          var html = this.template.replace('{title}', options.title);
          $(self.element).html(html);
          $el.css('display', 'inline-block');
        },
        afterLoadButtons: function () {
          var index = 0,
            $buttons = this.$el.find('.button'),
            count = $buttons.each(function () {
              index++;
              $(this).addClass('button-' + index);
            }).length;
          this.$el.addClass('social-services-' + count);
        }
      });
    });

    // --------------------------------------------------------------------
    // 3. Define misc functions and apply fixes
    // --------------------------------------------------------------------

    var $wpadminbar = $('#wpadminbar');
    var wpAdminBarHeight = function () {
      return $wpadminbar.length ? $wpadminbar.outerHeight() : 0;
    };

    var getHorizontalPageHeight = function () {
      return (
        $window.height() -
        $header.outerHeight() -
        $footer.outerHeight() -
        wpAdminBarHeight()
      );
    };

    var menuWalker = function ($root) {
      var items = [];

      $root.find('> li > a').each(function () {
        var $el = $(this),
          $parent = $el.parent(),
          $subEl = $el.next(),
          item = {
            href: $el.attr('href'),
            content: $el.html()
          };

        if ($subEl.length) {
          item.children = menuWalker($subEl);
        }
        if ($parent.is('.current_page_item')) {
          item.active = true;
        }
        items.push(item);
      });

      return items;
    };

    if (window.device.ipad) {
      // Simulate menu hover events on iPad
      // Navigate only on double-tap
      var $cascadedLinks = $('.site-navigation .has-children > a');

      $cascadedLinks.click(function (e) {
        var $el = $(this);
        if (!$el.is('.already-tapped')) {
          $cascadedLinks.removeClass('already-tapped');
          $el.addClass('already-tapped').trigger('mouseover');
          e.preventDefault();
        }
      });

      if (isLayoutHorizontal) {
        var scrollToTop = function () {
          // Scroll to top when we have horizontal page.
          // >768 is needed since horizontal pages turn
          // into vertical on small devices (eg. iPad Mini)
          if ($(window).scrollTop() > 0 && $(window).width() > 768) {
            $('body').animate({ scrollTop: 0 }, 200);
          }
        };

        $window.on('orientationchange.ios7-safari-bug.fluxus', function () {
          setTimeout(function () {
            if ($window.height() === 692) {
              scrollToTop();
            }
          }, 200);
        });
      }
    }

    // Fixes menu issue, when popup is outside the screen.
    // Supports WPML menu items.
    $('.site-navigation .has-children, .menu-item-language').hover(
      function () {
        var $submenu = $(this).children('.sub-menu');

        if ($submenu.length) {
          // if popup is outside the screen, then align it by the right side of the screen.
          if (
            $submenu.offset().left +
              $submenu.outerWidth() -
              $(document).scrollLeft() >
            $window.width()
          ) {
            $submenu.addClass('sub-menu-right');
          }
        }
      },
      function () {
        $(this).children('.sub-menu').removeClass('sub-menu-right');
      }
    );

    // --------------------------------------------------------------------
    // 4. Setup global listeners: window.resize
    // --------------------------------------------------------------------

    // General resize
    var scrollListenerAdded = false;
    var isVerticallyScrolled = false;
    helpers.onWindowResize(
      function () {
        var $menuItems;

        // Activate mobile menu if page is smaller than 768
        if ($window.width() <= 768) {
          if (!window.mobileMenu) {
            $menuItems = $('.site-navigation > nav > ul');
            if ($menuItems.length > 0) {
              window.mobileMenu = new BurgerMenu({
                items: menuWalker($menuItems),
                backgroundImage: $('.site-navigation').data('image'),
                container: $('.js-site-header')
              });
            }
          }
          window.mobileMenu && window.mobileMenu.enable();

          if (!isLayoutWithoutScroll && !scrollListenerAdded) {
            scrollListenerAdded = true;
            var touching = false;
            window.addEventListener('touchstart', function () {
              touching = true;
            });
            window.addEventListener('touchend', function () {
              touching = false;
              $html.toggleClass('scroll-y', isVerticallyScrolled);
            });

            window.addEventListener(
              'scroll',
              _.throttle(function () {
                var rootEl = document.documentElement;
                var top =
                  (window.pageYOffset || rootEl.scrollTop) -
                  (rootEl.clientTop || 0);
                if (top > 0 && !isVerticallyScrolled) {
                  isVerticallyScrolled = true;
                  /**
                   * On Android Firefox adding class during scroll
                   * will cause a re-render that results in not smooth scrolling.
                   * Therefore we wait for touch to end before adding .scroll-y.
                   */
                  if (!touching) {
                    $html.addClass('scroll-y');
                  }
                } else if (top === 0 && isVerticallyScrolled) {
                  isVerticallyScrolled = false;
                  if (!touching) {
                    $html.removeClass('scroll-y');
                  }
                }
              }, 100),
              { passive: true }
            );
          }
        } else {
          window.mobileMenu && window.mobileMenu.disable();
        }
      },
      true,
      'page-resizer'
    );

    // Horizontal page resize
    if (isLayoutHorizontal) {
      helpers.onWindowResize(
        function () {
          // The header is position: fixed we have to calculate
          // the offset for main page dynamically.
          var headerHeight = $header.outerHeight();

          if (isLayoutHorizontalVertical()) {
            var windowHeight = $window.height();

            if ($html.is('.no-scroll')) {
              $main.css({
                height: windowHeight - headerHeight,
                top: 0
              });
            } else {
              // Grid layout deals with height separately.
              if (!$html.is('.layout-portfolio-grid')) {
                $main.css({
                  height: 'auto',
                  top: 0
                });
              }
            }
          } else {
            $main.css({
              height: getHorizontalPageHeight(),
              top: headerHeight
            });
          }
        },
        true,
        'horizontal-page'
      );

      $html.addClass('horizontal-page--loaded');

      // Setup tinyscrollbar plugin.
      helpers.runIfFound($('.scroll-container'), function ($el) {
        $el.tinyscrollbar();

        helpers.onWindowResize(function () {
          $el.each(function () {
            var $t = $(this),
              tsb = $t.data('tsb');

            $t.find('.scrollbar, .track').css('height', $t.height());
            tsb && tsb.update();
          });
        }, true);
      });
    }

    // --------------------------------------------------------------------
    // 5. Scripts for specific pages
    // --------------------------------------------------------------------

    // Page: Grid Portfolio
    if ($html.is('.layout-portfolio-grid')) {
      (function () {
        var $grid = $('.js-portfolio-grid'),
          defaults = $.extend($.Grid.defaults, $grid.data()),
          options,
          grid;

        if (!window.getGridOptions) {
          window.getGridOptions = function () {
            var windowWidth = $window.width(),
              windowHeight = $window.height(),
              options = {
                orientation: defaults.orientation,
                rows: defaults.rows,
                columns: defaults.columns
              };

            if (windowWidth <= 568) {
              options.columns = 1;
              options.rows = Math.ceil(windowHeight / 378);
              options.orientation = 'vertical';
            } else if (windowWidth <= 768) {
              if (defaults.columns > 2) {
                options.columns = 2;
              }
              options.rows = Math.ceil(windowHeight / 250);
              options.orientation = 'vertical';
            } else if (windowWidth <= 1024) {
              if (defaults.columns > 3) {
                options.columns = 3;
              }
              if (defaults.rows > 3) {
                options.rows = 3;
              }
            }
            return options;
          };
        }
        options = $.extend(defaults, window.getGridOptions());

        options.onRenderStart = function () {
          var options = this.options;
          var isVertical = options.orientation === 'vertical';
          var isAspectRatioAuto = options.aspectRatio === 'auto';
          var itemsPerScreen = options.rows * options.columns;
          var pageHeight;

          // When there are more items than could be fitted into
          // a viewport, the footer will get pushed out of screen.
          // So we need to remove it from our container height calculation.
          if (
            isVertical &&
            isAspectRatioAuto &&
            itemsPerScreen < $grid.children().length
          ) {
            pageHeight =
              $window.height() - $header.outerHeight() - options.gutterHeight;
          } else {
            pageHeight = getHorizontalPageHeight();
          }

          $grid.css('height', pageHeight);

          options = window.getGridOptions();
          this.options.orientation = options.orientation;
          this.options.rows = options.rows;
          this.options.columns = options.columns;
        };

        var loadRetinaImage = function ($el) {
          if (!$el.data('retina-image-loaded')) {
            $el.data('retina-image-loaded', true);
            var $preview = $el.children('.preview');
            if ($preview.data('max-size')) {
              $.preloadImage($preview.data('max-size')).then(function () {
                $preview.css('background-image', 'url(' + this.src + ')');
              });
            }
          }
        };

        options.onRenderComplete = function (grid, renderData, contextChanged) {
          if (contextChanged) {
            _.each(renderData.coordinates, function (coordinate, index) {
              if (coordinate.width > 1166) {
                loadRetinaImage(grid.$items.eq(index));
              }
            });

            if (this.isHorizontal()) {
              if ($grid.width() < renderData.rightmostX) {
                renderData.$rightmost.css(
                  'padding-right',
                  this.options.gutterWidth
                );
              } else {
                renderData.$rightmost.css('padding-right', 0);
              }
            } else {
              $main.css({
                height: renderData.bottommostY,
                top: 0
              });
            }
          }
        };

        // Enable Grid plugin
        $grid.grid(options);
        grid = $grid.data('grid');

        if (grid.isHorizontal()) {
          globalNavigation.setItems(grid.$items);
          var gutter = grid.options.gutterWidth;

          globalNavigation.options.nextItem = function () {
            var windowRight = $window.scrollLeft() + $window.width() - 30,
              nextItem;

            // Find the first item that is not being fully displayed
            // and scroll to that item.
            $.each(grid.lastRender.coords.coordinates, function (index) {
              if (this.x > windowRight || this.rightX - gutter > windowRight) {
                nextItem = this;
                return false;
              }
            });

            if (nextItem) {
              this.scrollTo(nextItem.rightX - $window.width() + gutter * 2);
            }
          };

          globalNavigation.options.previousItem = function () {
            var windowLeft = $window.scrollLeft(),
              previousItem;

            // Find the first item that is fully visible and scroll to the previous one.
            $.each(grid.lastRender.coords.coordinates, function (index) {
              if (index && this.x >= windowLeft) {
                previousItem = grid.lastRender.coords.coordinates[index - 1];
                return false;
              }
            });

            if (previousItem) {
              this.scrollTo(previousItem.x);
            }
          };
        }
      })();
    }

    //
    // Page: Portfolio Single
    //
    helpers.runIfFound($('.js-portfolio-single'), function ($mediaList) {
      var $resizables = $mediaList.find(
        '.js-horizontal-item__resizable, iframe'
      );

      /**
       * Function that holds logic when to scroll element into view.
       *   - When we're on horizontal page
       *   - When horizontal page is not vertical
       *   - When element's center is 25% or more away from window center.
       */
      var shouldScrollIntoView = function (el) {
        if (!isLayoutHorizontal || isLayoutHorizontalVertical()) {
          return false;
        }

        var scrollThreshold = 0.25;

        var bounding = el.getBoundingClientRect();
        var width = bounding.right - bounding.left;
        var windowWidth = $(window).width();
        var elCenter = bounding.left + width / 2;
        var windowCenter = windowWidth / 2;
        var distance = Math.abs(elCenter - windowCenter);
        var distanceInWindowWidths = distance / windowWidth;

        var isVeryCloseToCenter = distanceInWindowWidths < scrollThreshold;
        return !isVeryCloseToCenter;
      };

      if ($mediaList.is('.portfolio-single--onclick-scroll')) {
        // Activate click to scroll navigation
        $('.js-horizontal-media').on('click.click-to-scroll.fluxus', function (
          event
        ) {
          event.preventDefault();

          var $item = $(this).closest('.js-horizontal-content__item'),
            activeItem = globalNavigation.getActive();
          var $activeItem = activeItem.item;

          if ($activeItem.length && $item.length) {
            if ($item[0] == $activeItem[0]) {
              globalNavigation.nextItem();
            } else {
              globalNavigation.scrollToItem($item);
            }
          }
        });
      } else if (
        $mediaList.is('.portfolio-single--onclick-lightbox') ||
        $mediaList.is('.portfolio-single--onclick-lightbox-or-scroll')
      ) {
        var scrollOrLightbox = $mediaList.is(
          '.portfolio-single--onclick-lightbox-or-scroll'
        );
        // Bind Lightbox to image links and iframes
        $('.js-lightbox-media, .js-horizontal-item iframe').fluxusLightbox({
          onShow: globalNavigation.disable,
          onHide: globalNavigation.enable,
          onClick: function (event) {
            if (scrollOrLightbox && shouldScrollIntoView(event.currentTarget)) {
              globalNavigation.scrollToItem($(event.currentTarget));
              return false;
            }
          }
        });
      }

      $resizables.each(function () {
        var $el = $(this),
          width = $el.data('width') || $el.attr('width') || 1,
          height = $el.data('height') || $el.attr('height') || 1;

        $el.data({
          height: height,
          ratio: width / height
        });
      });

      /**
       * Captions under project images
       *
       * When captions are multiline we show an arrow that can
       * expand full caption of photo.
       */
      var calculateMultilineCaption = function ($elements) {
        $elements.each(function () {
          var $el = $(this);
          if (!$el.data('expanded')) {
            var containerHeight = $el.outerHeight();
            var contentHeight = $el[0].scrollHeight;
            var hasScroll = containerHeight < contentHeight;
            $el.toggleClass('captioned-media__caption--multiline', hasScroll);
          }
        });
      };
      var $captions = $([]);

      $('.js-captioned-media__caption').each(function () {
        var $el = $(this);

        $el.click(function () {
          var expanded = $el.data('expanded');
          $el.data('expanded', !expanded);

          if (expanded) {
            $el.removeClass('captioned-media__caption--expanded');
          } else {
            $el.css('height', 'auto');
            $el.width();
            $el.addClass('captioned-media__caption--expanded');
          }
        });

        $captions = $captions.add($el);
      });

      if ($captions.length) {
        helpers.onWindowResize(
          function () {
            calculateMultilineCaption($captions);
          },
          false,
          'multiline-caption'
        );
        $(document).on('lazyload-loaded', function () {
          calculateMultilineCaption($captions);
        });
      }
    });

    //
    // Page: Contacts
    //
    helpers.runIfFound($('.page-contacts'), function ($el) {
      var $contactsForm = $('.wpcf7'),
        $infobox = $el.find('.page'),
        $viewport = $infobox.children('.viewport'),
        iscroll;

      if ($contactsForm.length) {
        $contactsForm.detach();
        $('#contacts-modal .modal-contents').append($contactsForm);
      }

      $('#send-message').click(function (event) {
        event.preventDefault();
        $('#contacts-modal').reveal({
          closeonbackgroundclick: true,
          middle: true
        });
      });

      iscroll = new IScroll($infobox.get(0), {
        mouseWheel: true,
        scrollbars: 'custom'
      });

      helpers.onWindowResize(
        function () {
          var mainHeight = getHorizontalPageHeight();

          if ($viewport.height() > mainHeight) {
            !iscroll.enabled && iscroll.enable();
            iscroll.refresh();
          } else {
            iscroll.enabled && iscroll.disable();
          }
        },
        true,
        'contacts'
      );
    });

    $window.on('orientationchange.fluxus', function () {
      setTimeout(function () {
        $window.trigger('resize');
      }, 10);
    });

    // --------------------------------------------------------------------
    // 5. Shortcodes
    // --------------------------------------------------------------------

    //
    // Shortcode: Tabs
    //
    $('.tabs').each(function () {
      var $t = $(this);

      $t.find('.tabs-menu a')
        .click(function () {
          var $t = $(this),
            $p = $t.parent(),
            index = $p.prevAll().length;

          if ($p.is('.active')) {
            return false;
          }

          $p.parent().find('.active').removeClass('active');
          $p.addClass('active');

          $p.closest('.tabs')
            .find('.tab')
            .hide()
            .end()
            .find('.tab:eq(' + index + ')')
            .show();

          return false;
        })
        .each(function (index) {
          $(this)
            .wrapInner($('<span />'))
            .append($('<b>' + (index + 1) + '</b class="index">'));
        });
    });

    //
    // Shortcode: Accordion
    //
    $('.accordion').each(function () {
      var $accordion = $(this);

      $accordion.find('.panel-title a').click(function () {
        var $t = $(this);

        /**
         * This is the active panel. Let's collapse it.
         */
        if ($t.closest('.panel-active').length) {
          $t.closest('.panel-active')
            .find('.panel-content')
            .slideUp(500, function () {
              $(this).closest('.panel-active').removeClass('panel-active');
            });
          return false;
        }

        var $newPanel = $t.closest('.panel'),
          index = $newPanel.prevAll().length,
          $panelActive = $accordion.find('.panel-active');

        if ($panelActive.length) {
          $panelActive.find('.panel-content').slideUp(500, function () {
            $(this).closest('.panel').removeClass('panel-active');
            $accordion
              .find('.panel:eq(' + index + ') .panel-content')
              .slideDown(300)
              .closest('.panel')
              .addClass('panel-active');
          });
        } else {
          $accordion
            .find('.panel:eq(' + index + ') .panel-content')
            .slideDown(300)
            .closest('.panel')
            .addClass('panel-active');
        }

        return false;
      });
    });

    /**
     * Configure Plyr player
     */
    $('.js-plyr').each(function () {
      var $el = $(this);
      var playerDefaultOptions = {
        // debug: true,
        controls: [
          'play-large',
          'play',
          'current-time',
          'mute',
          'volume',
          'fullscreen'
        ],
        autoplay: false,
        autopause: false,
        loop: { active: true },
        clickToPlay: true,
        disableContextMenu: false,
        keyboard: { focused: false, global: false },
        settings: []
      };
      var playerOptions = Object.assign({}, playerDefaultOptions);
      var isRepeatMode = $el.data('plyr-repeat-mode') !== undefined;
      var shouldAutoplay = false;

      // Repeat mode = no controls / autoplay
      if (isRepeatMode) {
        shouldAutoplay = true;
        playerOptions.controls = [];
        playerOptions.clickToPlay = false; // Click mutes / umutes
      }

      if ($el.attr('playsinline') !== undefined) {
        shouldAutoplay = true;
      }

      if (shouldAutoplay) {
        playerOptions.muted = true;
        playerOptions.volume = 0;
      }

      var plyr = new Plyr(this, playerOptions);

      plyr.on('ready', function (event) {
        // For some reason Plyr 3.4.6 when playing Vimeo does not care for volume / mute settings.
        if (shouldAutoplay) {
          plyr.volume = 0;
          plyr.muted = true;
        }

        if (isRepeatMode) {
          // Click to mute / umute
          var doubleClickTimer;
          var preventSingleClick = false;
          $(event.target)
            .on('click', function () {
              doubleClickTimer = setTimeout(function () {
                if (!preventSingleClick) {
                  plyr.muted = !plyr.muted;
                  if (plyr.muted) {
                    plyr.volume = 0;
                  } else {
                    plyr.volume = 100;
                  }
                }
                preventSingleClick = false;
              }, 200);
            })
            .on('dblclick', function () {
              clearTimeout(doubleClickTimer);
              preventSingleClick = true;
            });
        }

        var playResult = plyr.play();
        // For HTML5 players, play() will return a Promise in some browsers -
        // WebKit and Mozilla according to MDN at time of writing.
        if (
          shouldAutoplay &&
          playResult &&
          typeof playResult.catch === 'function'
        ) {
          playResult.catch(function () {
            /**
             * WHen trying to autoplay and failing, let's re-initialize player
             * without autoplay option.
             */
            var $container = $el.closest('.plyr');
            var $newEl = $el.removeAttr('data-plyr-repeat-mode').clone();
            $container.replaceWith($newEl);

            plyr = new Plyr(
              $newEl[0],
              Object.assign({}, playerOptions, {
                controls: playerDefaultOptions.controls
              })
            );
          });
        }
      });
    });

    /**
     * Creates a blank image that helps layout the page
     * when real images are not yet loaded.
     */
    $('.js-aspect__placeholder').each(function () {
      var $el = $(this);
      // It won't work correctly if upscaleSize is smaller
      // than actual window size. 3840 seems like a big enough number.
      var upscaleSize = 3840;

      var dimensions = {
        width: parseInt(this.getAttribute('width'), 10) || 192,
        height: parseInt(this.getAttribute('height'), 10) || 128
      };

      var ratio = dimensions.width / dimensions.height;
      var ratioCacheKey = 'aspect-placeholder-' + Math.round(ratio * 1000);

      var attrs = {};
      var cachedAttrs = localStorage.getItem(ratioCacheKey);

      if (cachedAttrs) {
        attrs = JSON.parse(cachedAttrs);
      } else {
        var smallerSide =
          dimensions.width < dimensions.height ? 'width' : 'height';
        var widerSide = smallerSide === 'height' ? 'width' : 'height';
        dimensions[widerSide] = upscaleSize;
        dimensions[smallerSide] = upscaleSize * (ratio < 1 ? ratio : 1 / ratio);

        var canvas = document.createElement('canvas');
        canvas.width = dimensions.width;
        canvas.height = dimensions.height;

        attrs = {
          width: canvas.width,
          height: canvas.height,
          src: canvas.toDataURL('image/png')
        };
        try {
          localStorage.setItem(ratioCacheKey, JSON.stringify(attrs));
        } catch (err) {
          console.log('Unable to save to localStorage');
        }
      }

      $el.attr(attrs);
    });
  });

  /**
   * Configure lazysizes plugin
   *
   * 1. Wraps <img class="lazyload" /> with <div class="lazyload-component" />
   * 2. Inserts a placeholder <img /> that matches size of
   *    original image (taken from data-width / data-height).
   *    This is superior to any percentage padding trick.
   * 3. Shows loading indicator when it takes longer than transition-delay.
   * 4. Triggers lazyload-loaded event on document
   */
  window.lazySizesConfig = window.lazySizesConfig || {
    // Load all images when browser is idle for 1s
    // Values below 50 disable the feature
    ricTimeout: 1000,
    // When browser is idling load images as far as
    // (expFactor x expand)px
    expFactor: 8,
    expand: 1000
  };

  $('.lazyload').each(function () {
    var $el = $(this).addClass('lazyload-component__image');
    var $wrapper = $el.wrap($('<div class="lazyload-component" />')).parent();
    var $loading = $(
      '<div class="lazyload-component__loading translate-into-middle">'
    );
    $loading.append('<div class="fluxus-loading__indicator" />');
    $wrapper.append($loading);
  });

  document.addEventListener('lazyloaded', function (event) {
    var $parent = $(event.target).parent();
    $parent.addClass('lazyload-component--loaded');
    $(document).trigger('lazyload-loaded');
  });
})(jQuery, window.helpers);
