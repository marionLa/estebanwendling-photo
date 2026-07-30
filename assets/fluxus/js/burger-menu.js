(function($, window, document) {
  'use strict';

  var pluginName = 'burger-menu',
    defaults = {
      slideTime: 500,
      backgroundImage: '',
      items: []
    },
    on = function($el, eventName, callback) {
      $el.on(eventName + '.burger-menu', callback);
    },
    off = function($el, eventName) {
      $el.off(eventName + '.burger-menu');
    };

  var BurgerMenu = function(options) {
    this.options = _.defaults(options || {}, defaults);
    this.$el = this._buildMarkup();
    this.$menu = this.$el.find('.burger-menu-items');
    this.$container = options.container || $('body');

    this.$overlay = $('<div class="burger-menu-dim"></div>').appendTo(
      this.$container
    );

    this.toggle = this.toggle.bind(this);

    this.$container
      .append(this.$el)
      .on('click', '.js-burger-menu-toggle', this.toggle);

    this.$el
      .find('.burger-menu-children-toggle')
      .on('click.burger-menu', function(e) {
        e && e.preventDefault();
        var $parent = $(this).parent(),
          $subMenu = $parent.children('ul'),
          expanded = $parent.is('.burger-menu-item-expanded');

        $parent.toggleClass('burger-menu-item-expanded', !expanded);
        if (expanded) {
          $subMenu.slideUp(400);
        } else {
          $subMenu.slideDown(400);
        }
      });

    this.$el.find('.burger-menu-link').on('click.burger-menu', function() {
      $(this).addClass('burger-menu-link-clicked');
    });

    this.collapse = this.collapse.bind(this);
    this.$overlay.click(this.collapse);
  };

  BurgerMenu.prototype = {
    toggle: function(event) {
      event && event.preventDefault();
      this[this.$el.is('.burger-menu--expanded') ? 'collapse' : 'expand'].call(
        this
      );
    },

    expand: function() {
      if (this.$el.is('.burger-menu--expanded')) {
        return;
      }

      $('html').addClass('burger-menu-visible');
      this.$el.addClass('burger-menu--expanded');
    },

    collapse: function() {
      if (!this.$el.is('.burger-menu--expanded')) {
        return;
      }

      $('html').removeClass('burger-menu-visible');
      this.$el.removeClass('burger-menu--expanded');
    },

    enable: function() {
      if (this.$el.is('.burger-menu--enabled')) {
        return;
      }

      this.$el.addClass('burger-menu--enabled');
      this.$el.show();
    },

    disable: function() {
      if (!this.$el.is('.burger-menu--enabled')) {
        return;
      }

      this.$el.removeClass('burger-menu--enabled');
      this.$el.is('.expanded') && this.collapse();
    },

    _disableDocumentTouchScroll: function() {
      var $menu = this.$menu;

      $(document).on('touchmove.burger-menu', function(e) {
        e.preventDefault();
      });

      $menu.on('touchmove.burger-menu', function(e) {
        e.stopPropagation();
        if ($menu.get(0).scrollHeight <= $menu.innerHeight()) {
          e.preventDefault();
        }
      });
    },

    _enableDocumentTouchScroll: function() {
      $(document).off('touchmove.burger-menu');
      this.$menu.off('touchmove.burger-menu');
    },

    _menuWalker: function(items, level) {
      var that = this,
        html = '';

      _.each(items, function(item) {
        var el =
            '<li class="%activeItemClass"><a class="burger-menu-link %activeItemClass" href="%href">%content</a>%childrenToggle%children</li>',
          children = '',
          activeItemClass = item.active ? 'burger-menu-item-active' : '',
          childrenToggle = '';

        if (item.children) {
          children = that._menuWalker.call(that, item.children, level + 1);
          childrenToggle =
            '<a href="#" class="burger-menu-children-toggle"></a>';
        }

        html += el
          .replace('%href', item.href)
          .replace('%childrenToggle', childrenToggle)
          .replace('%content', item.content)
          .replace('%children', children)
          .replace(new RegExp('%activeItemClass', 'g'), activeItemClass);
      });

      return '<ul class="burger-menu-level-' + level + '">' + html + '</ul>';
    },

    _buildMarkup: function() {
      var markup =
          '<div class="burger-menu">' +
          '<a class="js-burger-menu-toggle burger-menu-toggle" href="#"><span></span></a>' +
          '<div class="burger-menu-items">' +
          this._menuWalker(this.options.items, 0) +
          '</div>' +
          '</div>',
        $el = $(markup);

      $el
        .find('.burger-menu-item-active')
        .parents('li')
        .each(function() {
          $(this)
            .addClass('burger-menu-item-active burger-menu-item-expanded')
            .children('.burger-menu-link')
            .addClass('burger-menu-item-active');
        });

      if (this.options.backgroundImage) {
        var $bg = $('<div class="bg" />').css(
          'background-image',
          'url("' + this.options.backgroundImage + '")'
        );
        $el.find('.burger-menu-items').prepend($bg);
      }

      return $el;
    }
  };

  window.BurgerMenu = BurgerMenu;
})(jQuery, window, document);
