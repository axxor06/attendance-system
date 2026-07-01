/**
 * Catches 404s for unmatched routes.
 */
export function notFoundHandler(req, res, next) {
  next(new Error(`Route not found: ${req.method} ${req.originalUrl}`));
}

/**
 * Centralized error handler. Must be registered LAST in the middleware
 * chain. Normalizes ApiError, Mongoose validation/cast errors, JWT errors,
 * and duplicate-key errors into a consistent JSON response shape.
 */
export function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let details = err.details || null;

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    details = Object.values(err.errors).map((e) => e.message);
    message = 'Validation failed';
  }

  // Mongoose bad ObjectId cast
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid value for field '${err.path}'`;
  }

  // Mongo duplicate key
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0];
    message = field
      ? `A record with that ${field} already exists.`
      : 'Duplicate value violates a unique constraint.';
  }

  if (process.env.NODE_ENV !== 'production') {
    console.error(`[Error] ${req.method} ${req.originalUrl} ->`, err);
  } else if (statusCode >= 500) {
    console.error(`[Error] ${req.method} ${req.originalUrl} -> ${message}`);
  }

  res.status(statusCode).json({
    success: false,
    message,
    details,
    ...(process.env.NODE_ENV !== 'production' ? { stack: err.stack } : {}),
  });
}
