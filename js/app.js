(function (app) {
  'use strict';

  var welcomeScreen = document.getElementById('welcome-screen');

  var collectionScreen = document.getElementById('collection-screen');

  var usersList = document.getElementById('users-list');

  var welcomeMessage = document.getElementById('welcome-message');

  var collectionMessage = document.getElementById('collection-message');

  var collectionTitle = document.getElementById('collection-title');

  var progressText = document.getElementById('collection-progress-text');

  var progressBar = document.getElementById('collection-progress-bar');

  var collectionScroll = document.getElementById('collection-scroll');

  var retryUsersButton = document.getElementById('retry-users-button');

  var retryCollectionButton = document.getElementById(
    'retry-collection-button',
  );

  var backButton = document.getElementById('back-button');

  var selectedUser = null;
  var requestId = 0;

  /**
   * Calculate a collection progress percentage.
   *
   * @param {number} unlocked Unlocked cards.
   * @param {number} total Total cards.
   * @return {number} Progress percentage.
   */
  function getPercentage(unlocked, total) {
    if (total === 0) {
      return 0;
    }

    return Math.max(0, Math.min(100, (unlocked * 100) / total));
  }

  /**
   * Create a DOM element with a class and optional text.
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
   * Create the profile selection button.
   *
   * @param {Object} user User data.
   * @param {number} index User list position.
   * @return {HTMLElement} Profile button.
   */
  function createUserButton(user, index) {
    var button = createElement(
      'button',
      'user-button ' + (index % 2 === 0 ? 'user-green' : 'user-red'),
    );

    var track = createElement('span', 'progress-track');

    var bar = createElement('span', 'progress-bar');

    button.type = 'button';

    button.appendChild(createElement('span', 'user-symbol', '✦'));

    button.appendChild(createElement('span', 'user-name', user.name));

    button.appendChild(
      createElement(
        'span',
        'user-progress',
        user.unlocked + ' / ' + user.total,
      ),
    );

    bar.style.width = getPercentage(user.unlocked, user.total) + '%';

    track.appendChild(bar);
    button.appendChild(track);

    button.appendChild(createElement('span', 'user-action', 'Nire bilduma'));

    button.onclick = function () {
      showCollection(user);
    };

    return button;
  }

  /**
   * Retrieve and display the available users.
   */
  function loadUsers() {
    var currentRequest = ++requestId;

    usersList.innerHTML = '';
    welcomeMessage.textContent = 'Kargatzen...';
    retryUsersButton.hidden = true;

    app.api.getUsers(function (error, response) {
      var i;

      if (currentRequest !== requestId) {
        return;
      }

      if (
        error ||
        !response ||
        response.status !== 'ok' ||
        !Array.isArray(response.users)
      ) {
        welcomeMessage.textContent =
          'Ezin izan da erabiltzaileen zerrenda kargatu.';

        retryUsersButton.hidden = false;

        return;
      }

      welcomeMessage.textContent = '';

      if (response.users.length === 0) {
        welcomeMessage.textContent = 'Oraindik ez dago erabiltzailerik.';

        return;
      }

      for (i = 0; i < response.users.length; i++) {
        usersList.appendChild(createUserButton(response.users[i], i));
      }
    });
  }

  /**
   * Return to the user selection screen.
   */
  function showWelcome() {
    selectedUser = null;

    collectionScreen.hidden = true;
    welcomeScreen.hidden = false;

    loadUsers();
  }

  /**
   * Display the collection screen for the selected user.
   *
   * @param {Object} user Selected user.
   */
  function showCollection(user) {
    selectedUser = user;

    collectionTitle.textContent = user.name;

    welcomeScreen.hidden = true;
    collectionScreen.hidden = false;

    loadCollection();
  }

  /**
   * Update the collection progress indicator.
   */
  function updateProgress() {
    var unlocked = app.collection.getUnlockedCount();
    var total = app.collection.getTotalCount();

    progressText.textContent = unlocked + ' / ' + total;

    progressBar.style.width = getPercentage(unlocked, total) + '%';
  }

  /**
   * Handle selection of a locked or unlocked card.
   * The corresponding dialogs will be connected later.
   *
   * @param {Object} card Selected card.
   */
  function selectCard(card) {
    collectionMessage.textContent = card.unlocked
      ? card.name
      : card.number + '. kromoa';
  }

  /**
   * Retrieve and render the selected user's collection.
   */
  function loadCollection() {
    var currentRequest;

    if (selectedUser === null) {
      return;
    }

    currentRequest = ++requestId;

    app.collection.setCards([], selectCard);

    collectionScroll.scrollLeft = 0;

    updateProgress();

    collectionMessage.textContent = 'Kargatzen...';
    retryCollectionButton.hidden = true;

    app.api.getCollection(selectedUser.id, function (error, response) {
      if (currentRequest !== requestId) {
        return;
      }

      if (
        error ||
        !response ||
        response.status !== 'ok' ||
        !Array.isArray(response.cards)
      ) {
        collectionMessage.textContent = 'Ezin izan da bilduma kargatu.';

        retryCollectionButton.hidden = false;

        return;
      }

      app.collection.setCards(response.cards, selectCard);

      updateProgress();

      if (response.cards.length === 0) {
        collectionMessage.textContent = 'Oraindik ez dago kromorik.';
      } else {
        collectionMessage.textContent = '← Irristatu alboetara →';
      }
    });
  }

  backButton.onclick = showWelcome;

  retryUsersButton.onclick = loadUsers;

  retryCollectionButton.onclick = loadCollection;

  window.addEventListener(
    'resize',
    function () {
      app.collection.resize();
    },
    false,
  );

  showWelcome();
})(window.Kromoak);
