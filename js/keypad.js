(function (app) {
  "use strict";

  /**
   * Create a numeric keypad for a four-digit code.
   *
   * @param {HTMLElement} container Keypad container.
   * @param {HTMLElement} display Code display container.
   * @param {Function} onChange Code change callback.
   * @return {Object} Keypad controller.
   */
  function createKeypad(container, display, onChange) {
    var buttons = container.getElementsByTagName("button");
    var digits = display.getElementsByClassName("code-digit");

    var code = "";
    var disabled = false;

    /**
     * Render the current code in the four digit slots.
     */
    function render() {
      var i;

      for (i = 0; i < digits.length; i++) {
        digits[i].textContent = code.charAt(i) || "–";

        digits[i].className = "code-digit";

        if (i < code.length) {
          digits[i].className += " code-digit-filled";
        } else if (i === code.length) {
          digits[i].className += " code-digit-active";
        }
      }

      display.setAttribute("aria-label", code.length + " / 4");
    }

    /**
     * Notify the consumer that the code has changed.
     */
    function notifyChange() {
      render();
      onChange(code);
    }

    /**
     * Process a numeric or special keypad key.
     *
     * @param {string} key Selected key.
     */
    function press(key) {
      if (disabled) {
        return;
      }

      if (key === "clear") {
        code = "";
      } else if (key === "delete") {
        code = code.slice(0, -1);
      } else if (/^[0-9]$/.test(key)) {
        if (code.length >= 4) {
          return;
        }

        code += key;
      } else {
        return;
      }

      notifyChange();
    }

    /**
     * Clear the entered code.
     */
    function reset() {
      code = "";
      notifyChange();
    }

    /**
     * Enable or disable all keypad buttons.
     *
     * @param {boolean} value Disabled state.
     */
    function setDisabled(value) {
      var i;

      disabled = value;

      for (i = 0; i < buttons.length; i++) {
        buttons[i].disabled = disabled;
      }
    }

    /**
     * Return the current code as a string.
     *
     * @return {string} Entered code.
     */
    function getCode() {
      return code;
    }

    /**
     * Register the click handlers for all keypad buttons.
     */
    function bindButtons() {
      var i;

      for (i = 0; i < buttons.length; i++) {
        buttons[i].onclick = function () {
          press(this.getAttribute("data-key"));
        };
      }
    }

    bindButtons();
    render();

    return {
      reset: reset,
      setDisabled: setDisabled,
      getCode: getCode
    };
  }

  app.keypad = {
    create: createKeypad
  };
})(window.Kromoak);
