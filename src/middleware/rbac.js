
const ROLE_LEVELS = {
  STOREKEEPER: 1,
  MANAGER: 2,
  ADMIN: 3,
};

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        code: 'FORBIDDEN',
        message: `This action requires one of the following roles: ${allowedRoles.join(', ')}. Your role: ${req.user.role}`,
      });
    }

    next();
  };
}

export const superAdminOnly = requireRole('SUPERADMIN');
export const adminOnly = requireRole('ADMIN');
export const managerOrAbove = requireRole('ADMIN', 'MANAGER');
export const allRoles = requireRole('ADMIN', 'MANAGER', 'STOREKEEPER');
