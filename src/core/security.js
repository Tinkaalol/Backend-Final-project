import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { redis } from '../config/redis.js';

const BCRYPT_ROUNDS = 12;

export async function hashPassword(plaintext) {
  return bcrypt.hash(plaintext, BCRYPT_ROUNDS);
}

export async function verifyPassword(plaintext, hash) {
  return bcrypt.compare(plaintext, hash);
}

export function signAccessToken(payload) {
  return jwt.sign(payload, config.JWT_SECRET, {
    expiresIn: config.JWT_ACCESS_EXPIRES_IN,
  });
}

export function signRefreshToken(payload) {
  return jwt.sign(payload, config.JWT_REFRESH_SECRET, {
    expiresIn: config.JWT_REFRESH_EXPIRES_IN,
  });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, config.JWT_SECRET);
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, config.JWT_REFRESH_SECRET);
}


export async function storeRefreshToken(userId, tokenId, expiresInSeconds = 604800) {
  await redis.set(`refresh:${userId}:${tokenId}`, 'valid', 'EX', expiresInSeconds);
}

export async function isRefreshTokenValid(userId, tokenId) {
  const val = await redis.get(`refresh:${userId}:${tokenId}`);
  return val === 'valid';
}

export async function revokeRefreshToken(userId, tokenId) {
  await redis.del(`refresh:${userId}:${tokenId}`);
}

export async function revokeAllUserTokens(userId) {
  const keys = await redis.keys(`refresh:${userId}:*`);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}
