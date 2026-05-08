import { prisma } from '../config/database.js';
import {
  hashPassword, verifyPassword,
  signAccessToken, signRefreshToken,
  verifyRefreshToken, storeRefreshToken,
  isRefreshTokenValid, revokeRefreshToken,
  revokeAllUserTokens,
} from '../core/security.js';
import { logAction } from '../utils/auditLogger.js';
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
} from './email.service.js';
import { v4 as uuidv4 } from 'uuid';

export async function registerUser({ email, password, role, tenantId }) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    const err = new Error('A user with this email already exists');
    err.statusCode = 409;
    err.code = 'DUPLICATE_EMAIL';
    throw err;
  }

  const passwordHash = await hashPassword(password);
  const emailVerifyToken = uuidv4();
  const emailVerifyExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); 

  const user = await prisma.user.create({
    data: {
      email, passwordHash, role, tenantId,
      emailVerifyToken,
      emailVerifyExpiresAt,
      isEmailVerified: false,
    },
    select: { id: true, email: true, role: true, tenantId: true, createdAt: true },
  });

  await sendVerificationEmail(email, emailVerifyToken);

  await logAction({
    userId: user.id, tenantId,
    action: 'USER_REGISTERED',
    entityType: 'User', entityId: user.id,
    newValue: { email, role },
  });

  return user;
}

export async function verifyEmail(token) {
  const user = await prisma.user.findFirst({
    where: {
      emailVerifyToken: token,
      emailVerifyExpiresAt: { gt: new Date() },
    },
  });

  if (!user) {
    const err = new Error('Invalid or expired verification token');
    err.statusCode = 400;
    err.code = 'INVALID_TOKEN';
    throw err;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      isEmailVerified: true,
      emailVerifyToken: null,
      emailVerifyExpiresAt: null,
    },
  });

  await sendWelcomeEmail(user.email, user.role);

  return { message: 'Email verified successfully. You can now log in.' };
}

export async function loginUser({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.isActive) {
    const err = new Error('Invalid credentials');
    err.statusCode = 401;
    err.code = 'INVALID_CREDENTIALS';
    throw err;
  }

  if (!user.isEmailVerified) {
    const err = new Error('Please verify your email before logging in');
    err.statusCode = 403;
    err.code = 'EMAIL_NOT_VERIFIED';
    throw err;
  }

  const passwordValid = await verifyPassword(password, user.passwordHash);
  if (!passwordValid) {
    const err = new Error('Invalid credentials');
    err.statusCode = 401;
    err.code = 'INVALID_CREDENTIALS';
    throw err;
  }

  const tokenId = uuidv4();
  const accessToken = signAccessToken({ userId: user.id, email: user.email, role: user.role, tenantId: user.tenantId });
  const refreshToken = signRefreshToken({ userId: user.id, tokenId });

  await storeRefreshToken(user.id, tokenId, 604800);

  return {
    accessToken, refreshToken,
    user: { id: user.id, email: user.email, role: user.role, tenantId: user.tenantId },
  };
}

export async function forgotPassword(email) {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) return { message: 'If this email exists, a reset link has been sent.' };

  const resetToken = uuidv4();
  const passwordResetExpiresAt = new Date(Date.now() + 60 * 60 * 1000); 

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordResetToken: resetToken, passwordResetExpiresAt },
  });

  await sendPasswordResetEmail(email, resetToken);

  return { message: 'If this email exists, a reset link has been sent.' };
}

export async function resetPassword(token, newPassword) {
  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken: token,
      passwordResetExpiresAt: { gt: new Date() },
    },
  });

  if (!user) {
    const err = new Error('Invalid or expired reset token');
    err.statusCode = 400;
    err.code = 'INVALID_TOKEN';
    throw err;
  }

  const passwordHash = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      passwordResetToken: null,
      passwordResetExpiresAt: null,
    },
  });

  await revokeAllUserTokens(user.id);

  return { message: 'Password reset successfully. You can now log in.' };
}

export async function refreshAccessToken(refreshTokenStr) {
  let payload;
  try {
    payload = verifyRefreshToken(refreshTokenStr);
  } catch {
    const err = new Error('Invalid or expired refresh token');
    err.statusCode = 401;
    err.code = 'INVALID_REFRESH_TOKEN';
    throw err;
  }

  const valid = await isRefreshTokenValid(payload.userId, payload.tokenId);
  if (!valid) {
    const err = new Error('Refresh token has been revoked');
    err.statusCode = 401;
    err.code = 'TOKEN_REVOKED';
    throw err;
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, email: true, role: true, tenantId: true, isActive: true },
  });

  if (!user || !user.isActive) {
    const err = new Error('User not found or deactivated');
    err.statusCode = 401;
    err.code = 'UNAUTHORIZED';
    throw err;
  }

  await revokeRefreshToken(payload.userId, payload.tokenId);

  const newTokenId = uuidv4();
  const newAccessToken = signAccessToken({
    userId: user.id, email: user.email, role: user.role, tenantId: user.tenantId,
  });
  const newRefreshToken = signRefreshToken({ userId: user.id, tokenId: newTokenId });
  await storeRefreshToken(user.id, newTokenId, 604800);

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}

export async function logoutUser(refreshTokenStr) {
  try {
    const payload = verifyRefreshToken(refreshTokenStr);
    await revokeRefreshToken(payload.userId, payload.tokenId);
  } catch {
  }
}
