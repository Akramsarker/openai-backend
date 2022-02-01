const axios = require("axios");

axios.defaults.headers.common = {
  "Referrer-Policy": "origin-when-cross-origin",
  "X-Frame-Options": "SAMEORIGIN",
  "Content-Security-Policy": "frame-ancestors 'none'"
};

module.exports = {
  client() {
    const defaultOptions = {
      headers: {}
    };

    return {
      get: (url, options = {}) =>
        axios.get(url, { ...defaultOptions, ...options }),
      post: (url, data, options = {}) =>
        axios.post(url, data, { ...defaultOptions, ...options }),
      put: (url, data, options = {}) =>
        axios.put(url, data, { ...defaultOptions, ...options }),
      delete: (url, options = {}) =>
        axios.delete(url, { ...defaultOptions, ...options })
    };
  }
};
