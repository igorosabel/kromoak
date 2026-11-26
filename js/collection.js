(function (app) {
  'use strict';

  var scroll = document.getElementById('collection-scroll');

  var board = document.getElementById('collection-board');

  var cards = [];
  var columns = 0;
  var selectCallback = null;

  /**
   * Create a DOM element with an optional class and text.
   *
   * @param {string} tag HTML tag.
   * @param {string} className CSS class.
   * @param {string} text Element text.
   * @return {HTMLElement} Created element.
   */
  function createElement(tag, className, text) {
    var element = document.createElement(tag);

    element.className = className || '';

    if (typeof text !== 'undefined') {
      element.textContent = text;
    }

    return element;
  }

  /**
   * Create a locked card with its number and unlock button.
   *
   * @param {Object} card Card data.
   * @return {HTMLElement} Card element.
   */
  function createLockedCard(card) {
    var tile = createElement('button', 'card-tile card-locked');

    tile.type = 'button';

    tile.setAttribute('aria-label', card.number + '. kromoa desblokeatu');

    tile.appendChild(createElement('span', 'card-number', String(card.number)));

    tile.appendChild(createElement('span', 'card-question', '?'));

    tile.appendChild(
      createElement('span', 'card-unlock-button', 'Desblokeatu'),
    );

    tile.onclick = function () {
      if (selectCallback !== null) {
        selectCallback(card);
      }
    };

    return tile;
  }

  /**
   * Create an unlocked card displaying its image.
   *
   * @param {Object} card Card data.
   * @return {HTMLElement} Card element.
   */
  function createUnlockedCard(card) {
    var tile = createElement('button', 'card-tile card-unlocked');

    var image = createElement('img', 'card-image');

    var fallback = createElement('span', 'card-image-fallback', card.name);

    tile.type = 'button';

    tile.setAttribute('aria-label', card.name);

    image.alt = card.name;
    image.draggable = false;

    fallback.hidden = true;

    image.onerror = function () {
      image.hidden = true;
      fallback.hidden = false;
    };

    image.src = app.api.getImageUrl(card.image_url);

    tile.appendChild(image);
    tile.appendChild(fallback);

    tile.onclick = function () {
      if (selectCallback !== null) {
        selectCallback(card);
      }
    };

    return tile;
  }

  /**
   * Adjust card dimensions to fit the available height.
   */
  function resize() {
    var rowHeight;
    var tileHeight;
    var tileWidth;
    var tiles;
    var rows;
    var i;

    if (columns === 0 || scroll.clientHeight === 0) {
      return;
    }

    rowHeight = Math.floor(scroll.clientHeight / app.config.collectionRows);

    tileHeight = Math.max(1, rowHeight - 8);

    tileWidth = Math.max(1, Math.floor(tileHeight * 0.7));

    board.style.width = columns * (tileWidth + 8) + 'px';

    rows = board.getElementsByClassName('collection-row');

    for (i = 0; i < rows.length; i++) {
      rows[i].style.height = rowHeight + 'px';
    }

    tiles = board.getElementsByClassName('card-tile');

    for (i = 0; i < tiles.length; i++) {
      tiles[i].style.width = tileWidth + 'px';
      tiles[i].style.height = tileHeight + 'px';
    }
  }

  /**
   * Render the complete collection in row-major order.
   */
  function render() {
    var row;
    var index;
    var card;
    var tile;
    var r;
    var c;

    board.innerHTML = '';

    columns = Math.ceil(cards.length / app.config.collectionRows);

    for (r = 0; r < app.config.collectionRows; r++) {
      row = createElement('div', 'collection-row');

      for (c = 0; c < columns; c++) {
        index = r * columns + c;

        if (index >= cards.length) {
          break;
        }

        card = cards[index];

        tile = card.unlocked
          ? createUnlockedCard(card)
          : createLockedCard(card);

        row.appendChild(tile);
      }

      board.appendChild(row);
    }

    resize();
  }

  app.collection = {
    /**
     * Set the cards and their selection handler.
     *
     * @param {Array} items Collection cards.
     * @param {Function} callback Card selection handler.
     */
    setCards: function (items, callback) {
      cards = items.slice(0);
      selectCallback = callback;

      render();
    },

    /**
     * Replace an existing card after an unlock.
     *
     * @param {Object} updatedCard Updated card.
     */
    updateCard: function (updatedCard) {
      var tiles;
      var i;

      for (i = 0; i < cards.length; i++) {
        if (cards[i].id === updatedCard.id) {
          cards[i] = updatedCard;

          tiles = board.getElementsByClassName('card-tile');

          if (tiles[i]) {
            tiles[i].parentNode.replaceChild(
              updatedCard.unlocked
                ? createUnlockedCard(updatedCard)
                : createLockedCard(updatedCard),
              tiles[i],
            );

            resize();
          }

          return;
        }
      }
    },

    /**
     * Count the unlocked cards.
     *
     * @return {number} Number of unlocked cards.
     */
    getUnlockedCount: function () {
      var count = 0;
      var i;

      for (i = 0; i < cards.length; i++) {
        if (cards[i].unlocked) {
          count++;
        }
      }

      return count;
    },

    /**
     * Get the total number of assigned cards.
     *
     * @return {number} Collection size.
     */
    getTotalCount: function () {
      return cards.length;
    },

    /**
     * Recalculate the collection dimensions.
     */
    resize: resize,
  };
})(window.Kromoak);
