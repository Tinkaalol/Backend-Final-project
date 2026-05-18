import { verifyAccessToken, isAccessTokenBlacklisted } from '../core/security.js';
import { prisma } from '../config/database.js';

export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      code: 'UNAUTHORIZED',
      message: 'Authorization header missing or malformed. Expected: Bearer <token>',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = verifyAccessToken(token);

    if (await isAccessTokenBlacklisted(token)) {
      return res.status(401).json({
        code: 'UNAUTHORIZED',
        message: 'Token has been revoked. Please log in again.',
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, role: true, tenantId: true, isActive: true },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        code: 'UNAUTHORIZED',
        message: 'User account not found or deactivated',
      });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        code: 'TOKEN_EXPIRED',
        message: 'Access token expired. Use /auth/refresh to get a new one.',
      });
    }
    return res.status(401).json({
      code: 'INVALID_TOKEN',
      message: 'Invalid token signature',
    });
  }
}
