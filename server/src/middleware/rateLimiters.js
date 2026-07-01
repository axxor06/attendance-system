import rateLimit from 'express-rate-limit';

const windowMinutes = Number(process.env.RATE_LIMIT_WINDOW_MINUTES) || 15;

/**
 * General API rate limiter - applied to all routes.
 */
export const generalLimiter = rateLimit({
  windowMs: windowMinutes * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again later.',
  },
});

/**
 * Stricter limiter for auth-sensitive endpoints (login, OTP, password reset)
 * to slow down brute-force and OTP-guessing attacks.
 */
export const authLimiter = rateLimit({
  windowMs: windowMinutes * 60 * 1000,
  max: Number(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS) || 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many attempts. Please wait before trying again.',
  },
});
