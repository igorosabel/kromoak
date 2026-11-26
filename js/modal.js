(function (app) {
  "use strict";

  var overlay = document.getElementById("card-modal");
  var unlockPanel = document.getElementById("unlock-panel");
  var imagePanel = document.getElementById("image-panel");

  var unlockCardNumber = document.getElementById("unlock-card-number");
  var unlockMessage = document.getElementById("unlock-message");
  var unlockCountdown = document.getElementById("unlock-countdown");

  var submitButton = document.getElementById("unlock-submit-button");
  var cancelButton = document.getElementById("unlock-cancel-button");

  var imageTitle = document.getElementById("image-title");
  var imageName = document.getElementById("image-name");
  var imageMessage = document.getElementById("image-message");
  var cardImage = document.getElementById("modal-card-image");
  var imageCloseButton = document.getElementById("image-close-button");

  var revealLock = document.getElementById("reveal-lock");
  var celebration = document.getElementById("collection-celebration");

  var active = null;
  var busy = false;
  var timer = null;
  var previousFocus = null;
  var blockedUntil = {};

  var keypad = app.keypad.create(
    document.getElementById("keypad"),
    document.getElementById("code-display"),
    refreshControls
  );

  /**
   * Build a unique key for a user and card assignment.
   *
   * @param {number} userId User identifier.
   * @param {number} cardId Card identifier.
   * @return {string} Assignment key.
   */
  function getAssignmentKey(userId, cardId) {
    return userId + ":" + cardId;
  }

  /**
   * Get the remaining block duration in seconds.
   *
   * @return {number} Remaining seconds.
   */
  function getRemainingSeconds() {
    var expiration;
    var remaining;

    if (active === null || active.mode !== "unlock") {
      return 0;
    }

    expiration = blockedUntil[active.key] || 0;

    remaining = Math.max(0, Math.ceil((expiration - Date.now()) / 1000));

    if (remaining === 0) {
      delete blockedUntil[active.key];
    }

    return remaining;
  }

  /**
   * Format a duration as minutes and seconds.
   *
   * @param {number} seconds Remaining seconds.
   * @return {string} Formatted duration.
   */
  function formatDuration(seconds) {
    var minutes = Math.floor(seconds / 60);
    var remainder = seconds % 60;

    return (
      (minutes < 10 ? "0" : "") +
      minutes +
      ":" +
      (remainder < 10 ? "0" : "") +
      remainder
    );
  }

  /**
   * Refresh keypad availability, buttons and block countdown.
   */
  function refreshControls() {
    var remaining;
    var blocked;
    var wasBlocked;

    if (active === null || active.mode !== "unlock") {
      return;
    }

    remaining = getRemainingSeconds();
    blocked = remaining > 0;
    wasBlocked = !unlockCountdown.hidden;

    keypad.setDisabled(busy || blocked);

    submitButton.disabled = busy || blocked || keypad.getCode().length !== 4;

    cancelButton.disabled = busy;

    submitButton.textContent = busy ? "Egiaztatzen..." : "Desblokeatu";

    if (blocked) {
      unlockMessage.textContent = "Saiakera gehiegi! Itxaron pixka bat.";

      unlockCountdown.textContent = formatDuration(remaining);
      unlockCountdown.hidden = false;
    } else {
      unlockCountdown.hidden = true;
      unlockCountdown.textContent = "";

      if (wasBlocked) {
        unlockMessage.textContent = "Berriro saia zaitezke!";
      }
    }
  }

  /**
   * Stop the current countdown refresh timer.
   */
  function stopTimer() {
    if (timer !== null) {
      window.clearInterval(timer);
      timer = null;
    }
  }

  /**
   * Start refreshing the remaining block duration.
   */
  function startTimer() {
    stopTimer();

    timer = window.setInterval(refreshControls, 1000);
  }

  /**
   * Display the modal overlay.
   */
  function showOverlay() {
    if (overlay.hidden) {
      previousFocus = document.activeElement;
    }

    overlay.hidden = false;

    document
      .getElementById("collection-screen")
      .setAttribute("aria-hidden", "true");

    overlay.focus();
  }

  /**
   * Close the modal and release its current state.
   */
  function close() {
    if (busy) {
      return;
    }

    stopTimer();

    active = null;

    overlay.hidden = true;
    unlockPanel.hidden = true;
    imagePanel.hidden = true;

    cardImage.onload = null;
    cardImage.onerror = null;
    cardImage.removeAttribute("src");

    document.getElementById("collection-screen").removeAttribute("aria-hidden");

    if (
      previousFocus &&
      previousFocus !== document.body &&
      document.documentElement.contains(previousFocus)
    ) {
      previousFocus.focus();
    }

    previousFocus = null;
  }

  /**
   * Display the unlock modal for a locked card.
   *
   * @param {number} userId User identifier.
   * @param {Object} card Selected card.
   * @param {Function} onUnlocked Successful unlock callback.
   */
  function openUnlock(userId, card, onUnlocked) {
    if (busy) {
      return;
    }

    active = {
      mode: "unlock",
      userId: userId,
      card: card,
      key: getAssignmentKey(userId, card.id),
      onUnlocked: onUnlocked
    };

    unlockCardNumber.textContent = card.number + ". kromoa";
    unlockMessage.textContent = "";

    unlockCountdown.hidden = true;
    unlockCountdown.textContent = "";

    imagePanel.hidden = true;
    unlockPanel.hidden = false;

    overlay.setAttribute("aria-labelledby", "unlock-title");

    keypad.reset();

    refreshControls();
    startTimer();
    showOverlay();
  }

  /**
   * Display an unlocked card or a newly obtained card.
   *
   * @param {Object} card Unlocked card.
   * @param {boolean} isNew Whether the card has just been unlocked.
   * @param {boolean} completed Whether the collection is complete.
   */
  function showImage(card, isNew, completed) {
    stopTimer();

    active = {
      mode: "image",
      card: card
    };

    unlockPanel.hidden = true;
    imagePanel.hidden = false;

    imagePanel.className = "modal-panel image-panel";

    if (isNew) {
      imagePanel.className += " new-card-reveal";
    }

    if (completed) {
      imageTitle.textContent = "Bilduma osatuta!";
    } else if (isNew) {
      imageTitle.textContent = "Kromo berria!";
    } else {
      imageTitle.textContent = card.name;
    }

    imageName.textContent = card.name;
    imageName.hidden = !isNew;

    revealLock.hidden = !isNew;
    celebration.hidden = !completed;

    imageMessage.textContent = "Kargatzen...";

    cardImage.hidden = true;
    cardImage.alt = card.name;

    cardImage.onload = function () {
      cardImage.hidden = false;
      imageMessage.textContent = "";
    };

    cardImage.onerror = function () {
      cardImage.hidden = true;
      imageMessage.textContent = "Ezin izan da irudia kargatu.";
    };

    cardImage.src = app.api.getImageUrl(card.image_url);

    overlay.setAttribute("aria-labelledby", "image-title");

    showOverlay();
  }

  /**
   * Open the large image of an already unlocked card.
   *
   * @param {Object} card Selected card.
   */
  function openImage(card) {
    if (busy) {
      return;
    }

    showImage(card, false, false);
  }

  /**
   * Display an unsuccessful unlock result.
   *
   * @param {Object|null} error API request error.
   */
  function handleUnlockError(error) {
    var data = error && error.data ? error.data : {};
    var seconds;

    switch (data.status) {
      case "invalid_code":
        unlockMessage.textContent = "Kode okerra. Saiatu berriro!";
        break;

      case "invalid_format":
        unlockMessage.textContent = "Sartu lau digituko kodea.";
        break;

      case "not_available":
        unlockMessage.textContent = "Oraindik ez dago eskuragarri.";
        break;

      case "not_found":
        unlockMessage.textContent = "Kromoa ez da aurkitu.";
        break;

      case "too_many_attempts":
        seconds = Number(data.retry_after);

        if (isFinite(seconds) && seconds > 0) {
          blockedUntil[active.key] = Date.now() + Math.ceil(seconds) * 1000;
        } else {
          unlockMessage.textContent = "Saiakera gehiegi!";
        }

        break;

      default:
        unlockMessage.textContent = "Konexio-arazoa. Saiatu berriro.";
        break;
    }

    keypad.reset();
    refreshControls();
  }

  /**
   * Submit the current code and handle the server response.
   */
  function submitUnlock() {
    var code;
    var current;

    if (
      active === null ||
      active.mode !== "unlock" ||
      busy ||
      getRemainingSeconds() > 0
    ) {
      return;
    }

    code = keypad.getCode();

    if (code.length !== 4) {
      return;
    }

    current = active;
    busy = true;

    unlockMessage.textContent = "";

    refreshControls();

    app.api.unlockCard(
      current.userId,
      current.card.id,
      code,
      function (error, response) {
        var isNew;
        var completed;

        if (active !== current) {
          return;
        }

        busy = false;

        if (error) {
          handleUnlockError(error);
          return;
        }

        if (
          !response ||
          (response.status !== "unlocked" &&
            response.status !== "already_unlocked") ||
          !response.card ||
          response.card.id !== current.card.id ||
          response.card.unlocked !== true
        ) {
          handleUnlockError(null);
          return;
        }

        delete blockedUntil[current.key];

        isNew = response.status === "unlocked";

        completed = current.onUnlocked(response.card) === true;

        keypad.reset();

        showImage(response.card, isNew, isNew && completed);
      }
    );
  }

  submitButton.onclick = submitUnlock;
  cancelButton.onclick = close;
  imageCloseButton.onclick = close;

  overlay.onclick = function (event) {
    if (event.target === overlay) {
      close();
    }
  };

  /**
   * Handle Escape and keep keyboard focus inside the active modal.
   *
   * @param {Event} event Keyboard event.
   */
  function handleKeyboard(event) {
    var panel;
    var buttons;
    var focusable = [];
    var first;
    var last;
    var i;

    if (overlay.hidden) {
      return;
    }

    if (event.keyCode === 27) {
      event.preventDefault();
      close();
      return;
    }

    if (event.keyCode !== 9) {
      return;
    }

    panel = unlockPanel.hidden ? imagePanel : unlockPanel;
    buttons = panel.getElementsByTagName("button");

    for (i = 0; i < buttons.length; i++) {
      if (!buttons[i].disabled) {
        focusable.push(buttons[i]);
      }
    }

    if (focusable.length === 0) {
      event.preventDefault();
      return;
    }

    first = focusable[0];
    last = focusable[focusable.length - 1];

    if (
      event.shiftKey &&
      (document.activeElement === first ||
        !panel.contains(document.activeElement))
    ) {
      event.preventDefault();
      last.focus();
    } else if (
      !event.shiftKey &&
      (document.activeElement === last ||
        !panel.contains(document.activeElement))
    ) {
      event.preventDefault();
      first.focus();
    }
  }

  document.addEventListener("keydown", handleKeyboard, false);

  app.modal = {
    openUnlock: openUnlock,
    openImage: openImage,
    close: close
  };
})(window.Kromoak);
