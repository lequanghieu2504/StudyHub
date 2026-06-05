import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'crypto';
import db from '@/lib/db';

function hashPassword(password, salt = randomBytes(16).toString('hex')) {
  const hash = scryptSync(password, salt, 32).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  if (!stored.includes(':')) return stored === 'demo' && password === 'demo123';
  const [salt, key] = stored.split(':');
  const hashedBuffer = Buffer.from(scryptSync(password, salt, 32).toString('hex'), 'hex');
  const keyBuffer = Buffer.from(key, 'hex');
  return keyBuffer.length === hashedBuffer.length && timingSafeEqual(keyBuffer, hashedBuffer);
}

export function createUser({ name, email, password, role = 'customer' }) {
  const id = randomUUID();
  const stmt = db.prepare(
    'INSERT INTO users (id,name,email,password_hash,role,created_at) VALUES (?, ?, ?, ?, ?, ?)'
  );
  stmt.run(id, name, email.toLowerCase(), hashPassword(password), role, new Date().toISOString());
  return db.prepare('SELECT id,name,email,role FROM users WHERE id = ?').get(id);
}

export function loginUser({ email, password }) {
  const user = db
    .prepare('SELECT id,name,email,role,password_hash FROM users WHERE email = ?')
    .get(email.toLowerCase());
  if (!user || !verifyPassword(password, user.password_hash)) return null;

  const token = randomBytes(24).toString('hex');
  db.prepare('INSERT INTO sessions (token,user_id,created_at) VALUES (?, ?, ?)').run(
    token,
    user.id,
    new Date().toISOString()
  );
  return { user: { id: user.id, name: user.name, email: user.email, role: user.role }, token };
}

export function getUserByToken(token) {
  if (!token) return null;
  return db
    .prepare(
      `SELECT u.id,u.name,u.email,u.role
       FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.token = ?`
    )
    .get(token);
}
