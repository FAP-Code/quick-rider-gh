import crypto from 'crypto';

export function generateOtp(length = 6): string {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[crypto.randomInt(0, digits.length)];
  }
  return otp;
}

export function otpExpiresAt(minutes = 10): Date {
  return new Date(Date.now() + minutes * 60 * 1000);
}
