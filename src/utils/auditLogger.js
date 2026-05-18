import { prisma } from '../config/database.js';


export async function logAction({ userId, tenantId, action, entityType, entityId, oldValue = null, newValue = null }) {
  if (!tenantId) return;
  await prisma.auditLog.create({
    data: {
      userId,
      tenantId,
      action,
      entityType,
      entityId,
      oldValue,
      newValue,
    },
  });
}
