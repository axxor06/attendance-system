import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { Otp } from '../models/index.js';

/**
 * Generates a numeric OTP of the configured length (default 6 digits)
 * using a cryptographically secure random source.
 */
export function generateOtpCode() {
  const length = Number(process.env.OTP_LENGTH) || 6;
  const max = 10 ** length;
  const min = 10 ** (length - 1);
  const num = crypto.randomInt(min, max);
  return String(num);
}

/**
 * Creates and stores a hashed OTP for the given email + purpose.
 * Invalidates any previous unconsumed OTPs for the same email+purpose
 * so only the most recent code is ever valid.
 * Returns the PLAINTEXT code (caller is responsible for emailing it -
 * it is never returned again after this).
 */
export async function createOtp(email, purpose) {
  const normalizedEmail = email.toLowerCase().trim();

  // Invalidate previous outstanding OTPs for this email+purpose.
  await Otp.deleteMany({ email: normalizedEmail, purpose, consumedAt: null });

  const code = generateOtpCode();
  const codeHash = await bcrypt.hash(code, 10);
  const minutes = Number(process.env.OTP_EXPIRES_MINUTES) || 10;
  const expiresAt = new Date(Date.now() + minutes * 60 * 1000);

  await Otp.create({ email: normalizedEmail, codeHash, purpose, expiresAt });

  return code;
}

/**
 * Verifies a submitted OTP code. On success, marks it consumed so it
 * cannot be reused. Tracks attempts and rejects after 5 incorrect tries
 * to slow down brute-forcing a 6-digit code.
 */
export async function verifyOtp(email, purpose, submittedCode) {
  const normalizedEmail = email.toLowerCase().trim();

  const otpDoc = await Otp.findOne({
    email: normalizedEmail,
    purpose,
    consumedAt: null,
  }).sort({ createdAt: -1 });

  if (!otpDoc) {
    return { valid: false, reason: 'No active code found. Please request a new one.' };
  }

  if (otpDoc.expiresAt < new Date()) {
    return { valid: false, reason: 'Code has expired. Please request a new one.' };
  }

  if (otpDoc.attempts >= 5) {
    return { valid: false, reason: 'Too many incorrect attempts. Please request a new code.' };
  }

  const isMatch = await bcrypt.compare(String(submittedCode), otpDoc.codeHash);

  if (!isMatch) {
    otpDoc.attempts += 1;
    await otpDoc.save();
    return { valid: false, reason: 'Incorrect code. Please try again.' };
  }

  otpDoc.consumedAt = new Date();
  await otpDoc.save();

  return { valid: true };
}
