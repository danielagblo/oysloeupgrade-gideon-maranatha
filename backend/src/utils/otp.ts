import crypto from 'node:crypto';

export const generateOTPCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const generateNonce = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

export const generateReferralCode = (length: number = 8): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};
