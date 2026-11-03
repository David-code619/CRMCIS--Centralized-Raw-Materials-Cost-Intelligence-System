/**
 * Async Handler Middleware
 * Wraps async route handlers and catches any errors, forwarding them to Express error handling.
 * Eliminates repetitive try/catch blocks in controllers.
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
