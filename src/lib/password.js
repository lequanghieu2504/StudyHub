import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';

export function hashPassword(password, salt = randomBytes(16).toString('hex')) {
  const hash = scryptSync(password, salt, 32).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password, stored) {
  if (!stored?.includes(':')) {
    const dummyComputed = scryptSync(password, 'fallback-salt', 32);
    const dummyExpected = Buffer.alloc(dummyComputed.length);
    timingSafeEqual(dummyComputed, dummyExpected);
    return false;
  }
  const [salt, key] = stored.split(':');
  const hashedBuffer = scryptSync(password, salt, 32);
  const keyBuffer = Buffer.from(key, 'hex');
  return keyBuffer.length === hashedBuffer.length && timingSafeEqual(keyBuffer, hashedBuffer);
}
