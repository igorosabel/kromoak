(function (app) {
  'use strict';

  /**
   * Send an asynchronous HTTP request to the API.
   *
   * @param {string} method HTTP method.
   * @param {string} path API path.
   * @param {Object|null} data Request body.
   * @param {Function} callback Completion callback.
   */
  function request(method, path, data, callback) {
    var xhr = new XMLHttpRequest();
    var completed = false;

    /**
     * Complete the request exactly once.
     *
     * @param {Object|null} error Request error.
     * @param {Object|null} response Response data.
     */
    function finish(error, response) {
      if (completed) {
        return;
      }

      completed = true;
      callback(error, response);
    }

    xhr.open(method, app.config.apiUrl + path, true);

    xhr.timeout = app.config.requestTimeout;

    xhr.setRequestHeader('Accept', 'application/json');

    if (data !== null) {
      xhr.setRequestHeader('Content-Type', 'application/json');
    }

    xhr.onreadystatechange = function () {
      var response;

      if (xhr.readyState !== 4 || xhr.status === 0) {
        return;
      }

      try {
        response = JSON.parse(xhr.responseText);
      } catch (error) {
        finish(
          {
            type: 'invalid_response',
            status: xhr.status,
          },
          null,
        );

        return;
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        finish(null, response);
        return;
      }

      finish(
        {
          type: 'http',
          status: xhr.status,
          data: response,
        },
        null,
      );
    };

    xhr.onerror = function () {
      finish(
        {
          type: 'network',
        },
        null,
      );
    };

    xhr.ontimeout = function () {
      finish(
        {
          type: 'timeout',
        },
        null,
      );
    };

    xhr.onabort = function () {
      finish(
        {
          type: 'aborted',
        },
        null,
      );
    };

    xhr.send(data === null ? null : JSON.stringify(data));
  }

  app.api = {
    /**
     * Retrieve all users and their progress.
     *
     * @param {Function} callback Completion callback.
     */
    getUsers: function (callback) {
      request('GET', '/users', null, callback);
    },

    /**
     * Retrieve the collection assigned to a user.
     *
     * @param {number} userId User identifier.
     * @param {Function} callback Completion callback.
     */
    getCollection: function (userId, callback) {
      request('GET', '/users/' + userId + '/cards', null, callback);
    },

    /**
     * Attempt to unlock a card.
     *
     * @param {number} userId User identifier.
     * @param {number} cardId Card identifier.
     * @param {string} code Four-digit unlock code.
     * @param {Function} callback Completion callback.
     */
    unlockCard: function (userId, cardId, code, callback) {
      request(
        'POST',
        '/users/' + userId + '/cards/' + cardId + '/unlock',
        {
          code: code,
        },
        callback,
      );
    },

    /**
     * Build the absolute URL of an authorized card image.
     *
     * @param {string} path Relative image path.
     * @return {string} Absolute image URL.
     */
    getImageUrl: function (path) {
      return app.config.apiUrl + path;
    },
  };
})(window.Kromoak);
