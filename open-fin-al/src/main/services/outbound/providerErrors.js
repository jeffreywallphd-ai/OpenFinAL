function createProviderError(message, options = {}) {
  const error = new Error(message);

  if (options.code) {
    error.code = options.code;
  }

  if (options.statusCode) {
    error.statusCode = options.statusCode;
  }

  if (options.cause) {
    error.cause = options.cause;
  }

  if (options.details !== undefined) {
    error.details = options.details;
  }

  return error;
}

module.exports = {
  createProviderError,
};
