/**
 * Fluxus Grid 2.0
 *
 * Fits elements into container in a nice grid fashion.
 */
(function($, $window) {
  $.Grid = function(el, options) {
    this.options = $.extend({}, $.Grid.defaults, options);
    this.$el = $(el);
    this.$parent = this.$el.parent();
    this.$items = this.$el.children();
    this.render = this.render.bind(this);

    // Parse aspectRatio if provided in X:Y format
    if (this.options.aspectRatio !== 'auto') {
      var temp = this.options.aspectRatio.match(/(\d+):(\d+)/);
      if (temp && temp.length === 3 && temp[2]) {
        this.options.aspectRatio = temp[1] / temp[2];
      }
    }

    this.lastRender = {
      width: -1,
      height: -1
    };

    this.render();
    this.$el.addClass('portfolio-grid--loaded');
    $window.on('resize.fluxus-grid-resize', _.debounce(this.render));
  };

  $.Grid.defaults = {
    orientation: 'vertical',
    aspectRatio: 'auto',
    gutterWidth: 15,
    gutterHeight: 15,
    rows: 3,
    columns: 4,
    onRenderStart: $.noop,
    onRenderComplete: $.noop
  };

  $.Grid.prototype = {
    isHorizontal: function() {
      return this.options.orientation === 'horizontal';
    },

    getItemWidth: function() {
      var totalGutterWidth =
        (this.options.columns - 1) * this.options.gutterWidth;
      var isFixedAspectRatio = !isNaN(parseFloat(this.options.aspectRatio));

      if (this.isHorizontal() && isFixedAspectRatio) {
        return this.getItemHeight() * this.options.aspectRatio;
      } else {
        return (this.$el.width() - totalGutterWidth) / this.options.columns;
      }
    },

    getItemHeight: function() {
      var totalGutterHeight =
        (this.options.rows - 1) * this.options.gutterHeight;
      var isFixedAspectRatio = !isNaN(parseFloat(this.options.aspectRatio));

      if (!this.isHorizontal() && isFixedAspectRatio) {
        return this.getItemWidth() / this.options.aspectRatio;
      } else {
        return (this.$el.height() - totalGutterHeight) / this.options.rows;
      }
    },

    calculateCoordinates: function() {
      var that = this;
      var coordinates = [];
      var maxSize = this.options[this.isHorizontal() ? 'rows' : 'columns'];
      var matrix = new $.GridMatrix({
        columnsLimit: this.options[this.isHorizontal() ? 'rows' : 'columns']
      });
      var itemWidth = this.getItemWidth();
      var itemHeight = this.getItemHeight();
      var rightmostX = 0;
      var bottommostY = 0;
      var $rightmost = null;
      var $bottommost = null;

      this.$items.each(function() {
        var $item = $(this);
        var itemColumn;
        var itemRow;
        var size = $item.data('size') || 1;
        var width;
        var height;
        var x;
        var y;

        size = size > maxSize ? maxSize : size;

        /**
         * Step 1.
         * Calculate free matrix sport, where current item would fit.
         */
        var gridSpot = matrix.getSpot(size);
        matrix.occupySpot(gridSpot[0], gridSpot[1], size);

        /**
         * Step 2.
         * Calculate actual CSS values according to grid position.
         */
        if (that.isHorizontal()) {
          itemRow = gridSpot[1];
          itemColumn = gridSpot[0];
        } else {
          itemRow = gridSpot[0];
          itemColumn = gridSpot[1];
        }

        width = itemWidth * size;
        height = itemHeight * size;

        x = itemColumn * itemWidth;
        y = itemRow * itemHeight;

        /**
         * Step 3.
         * Calculate gutters.
         */
        x += that.options.gutterWidth * itemColumn;
        y += that.options.gutterHeight * itemRow;

        // If size is bigger, then increase items width by the gutter amount it covers.
        if (size > 1) {
          width += that.options.gutterWidth * (size - 1);
          height += that.options.gutterHeight * (size - 1);
        }

        /**
         * Save rightmost and bottommost elements.
         */
        var rightX = x + width;

        if (rightmostX < rightX) {
          rightmostX = rightX;
          $rightmost = $item;
        }

        var bottomY = y + height;

        if (bottommostY < bottomY) {
          bottommostY = bottomY;
          $bottommost = $item;
        }

        coordinates.push({
          width: width,
          height: height,
          x: x,
          y: y,
          rightX: x + width,
          bottomY: y + height
        });
      });

      return {
        coordinates: coordinates,
        $rightmost: $rightmost,
        $bottommost: $bottommost,
        rightmostX: rightmostX,
        bottommostY: bottommostY
      };
    },

    render: function(renderOptions) {
      this.options.onRenderStart.call(this);

      var gridElWidth = this.$el.width();
      var gridElHeight = this.$el.height();
      var gridBaseSizeChanged;
      if (this.isHorizontal()) {
        gridBaseSizeChanged = gridElHeight !== this.lastRender.height;
      } else {
        gridBaseSizeChanged = gridElWidth !== this.lastRender.width;
      }
      var coords;

      renderOptions = renderOptions || {};

      // Check if our context has changed, if not, then there's no reason to render.
      var shouldRender = !!(gridBaseSizeChanged || renderOptions.force);
      if (!shouldRender) {
        this.options.onRenderComplete.call(
          this,
          this,
          this.lastRender.coords,
          false
        );
        return false;
      }

      coords = this.calculateCoordinates();

      this.lastRender = {
        width: gridElWidth,
        height: gridElHeight,
        coords: coords
      };

      this.$items.each(function(i) {
        var $t = $(this),
          c = coords.coordinates[i];

        $t.css({
          width: c.width,
          height: c.height,
          left: c.x,
          top: c.y
        });
      });

      this.options.onRenderComplete.call(this, this, coords, true);
    }
  };

  /**
   * Register as jQuery plugin.
   */
  $.fn.grid = function(options) {
    return $(this).data('grid', new $.Grid(this, options));
  };

  /**
   * A data structure for laying out items in a grid.
   */
  $.GridMatrix = function(options) {
    this.options = $.extend({}, $.GridMatrix.defaults, options);

    /**
     * An array of rows, that contains array of column values.
     *
     * Eg.
     *   _matrix = [ [1, 2, 3, 4], [5, 6, 7, 8] ]
     *   _matrix[0] = 1 2 3 4
     *   _matrix[1] = 5 6 7 8
     */
    this._matrix = [];
  };

  $.GridMatrix.defaults = {
    columnsLimit: 4
  };

  $.GridMatrix.prototype = {
    set: function(row, column) {
      if (this._matrix[row]) {
        this._matrix[row][column] = 1;
      } else {
        this._matrix[row] = [];
        this._matrix[row][column] = 1;
      }
    },

    _getSpotOnRow: function(rowIndex, size, columnOffset) {
      var row = this._matrix[rowIndex] || [];
      var foundAvailableSpotAt = false;
      size = size || 1;

      // Loop 0..columnsLimit positions
      for (
        var availableAt = columnOffset;
        availableAt < this.options.columnsLimit;
        availableAt++
      ) {
        foundAvailableSpotAt = availableAt;

        // Loop CurrentIndex..Size to see if every spot is empty
        for (var i = availableAt; i < availableAt + size; i++) {
          if (row[i] || i >= this.options.columnsLimit) {
            foundAvailableSpotAt = false;
          }
        }

        if (foundAvailableSpotAt !== false) {
          break;
        }
      }

      return foundAvailableSpotAt;
    },

    getSpot: function(size) {
      var currentRow = 0;
      var availableSpotFound = false; // Column index.
      size = size || 1;

      while (availableSpotFound === false) {
        for (var i = 0; i < size; i++) {
          // CurrentRow..CurrentRow + size
          var offset = 0;

          /**
           * If we had an available spot in the previous row and now we are checking
           * a proceeding row to see if the same spot is available. We must start from
           * the column, where a free spot was found in the previous row.
           */
          if (availableSpotFound !== false) {
            offset = availableSpotFound;
          }

          availableSpotFound = this._getSpotOnRow(currentRow + i, size, offset);
          if (availableSpotFound === false) {
            break;
          }
        }
        currentRow++;
      }

      return [currentRow - 1, availableSpotFound];
    },

    occupySpot: function(row, column, size) {
      for (var i = 0; i < size; i++) {
        for (var j = 0; j < size; j++) {
          this.set(row + i, column + j);
        }
      }
    }
  };
})(jQuery, jQuery(window));
