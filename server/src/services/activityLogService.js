import { ActivityLog } from '../models/index.js';

/**
 * Records an audit-trail entry. Failures here are logged but never thrown,
 * since logging should never block the primary request from succeeding.
 */
export async function logActivity({ actorId, action, targetType, targetId, description, ipAddress }) {
  try {
    await ActivityLog.create({
      actor: actorId,
      action,
      targetType,
      targetId,
      description,
      ipAddress,
    });
  } catch (err) {
    console.error('[ActivityLog] Failed to record activity:', err.message);
  }
}
