import { ApiResponse } from './apiResponse.js';
import logger from './logger.js';

function decodeJwtPayload(token) {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const jsonStr = Buffer.from(parts[1], 'base64').toString('utf8');
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}

/**
 * Role-Based Access Control (RBAC) Higher-Order Function.
 * Wraps a Next.js App Router handler to securely authorize specific roles.
 * 
 * @param {string[]} allowedRoles Array of roles (e.g. ['admin', 'lab', 'doctor', 'clinic'])
 * @param {Function} handler The route handler function
 * @returns {Function} Authorized handler
 */
export function withRoles(allowedRoles, handler) {
  if (typeof allowedRoles === 'function') {
    handler = allowedRoles;
    allowedRoles = [];
  }

  return async (req, context) => {
    try {
      let userId = req.headers.get('x-user-id');
      let userRole = req.headers.get('x-user-role') || req.headers.get('x-role');
      let clinicId = req.headers.get('x-user-clinic-id') || req.headers.get('x-clinic-id');
      let labId = req.headers.get('x-user-lab-id') || req.headers.get('x-lab-id');
      let labRole = req.headers.get('x-lab-role');
      let permissions = null;

      const labPermissionsHeader = req.headers.get('x-lab-permissions');
      if (labPermissionsHeader) {
        try {
          permissions = JSON.parse(labPermissionsHeader);
        } catch {}
      }

      // If headers not injected, check Authorization Bearer token
      if (!userId) {
        const authHeader = req.headers.get('authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
          const token = authHeader.substring(7).trim();
          const payload = decodeJwtPayload(token);
          if (payload) {
            userId = payload.id || payload.sub;
            userRole = payload.role;
            clinicId = clinicId || payload.clinicId;
            labId = labId || payload.labId;
            labRole = labRole || payload.labRole || payload.lab_role;
            if (!permissions) {
              permissions = payload.permissions || payload.labPermissions || null;
            }
          }
        }
      }

      if (!userId || !userRole) {
        return ApiResponse.error(
          'Missing or invalid authorization context',
          'UNAUTHORIZED',
          [],
          401
        );
      }

      req.user = {
        id: userId,
        _id: userId,
        role: userRole,
        clinicId: clinicId || null,
        labId: labId || (userRole === 'lab' ? userId : null),
        labRole: labRole || (userRole === 'lab' ? 'lab_admin' : userRole),
        ...(Array.isArray(permissions) ? { permissions } : {})
      };

      // Check RBAC if allowedRoles is provided
      if (allowedRoles && allowedRoles.length > 0) {
        const userRoleLower = (userRole || '').toLowerCase();
        const labRoleLower = (labRole || '').toLowerCase();
        const normalizedAllowedRoles = allowedRoles.map(r => String(r).toLowerCase());

        const hasAccess =
          normalizedAllowedRoles.includes('*') ||
          normalizedAllowedRoles.includes(userRoleLower) ||
          normalizedAllowedRoles.includes(labRoleLower) ||
          userRoleLower === 'admin' ||
          userRoleLower === 'superadmin';

        if (!hasAccess) {
          if (logger && typeof logger.warn === 'function') {
            logger.warn(`Security Event: Access Denied for User ID ${userId}. Expected ${allowedRoles.join(', ')} but got ${userRole}`);
          }
          return ApiResponse.error(
            `Access Denied. Required roles: ${allowedRoles.join(', ')}`,
            'FORBIDDEN',
            { yourRole: userRole },
            403
          );
        }
      }
    } catch (error) {
      if (logger && typeof logger.error === 'function') {
        logger.error('RBAC Authorization Error in authGuard:', { message: error.message, stack: error.stack });
      } else {
        console.error('RBAC Authorization Error in authGuard:', error);
      }
      return ApiResponse.error(
        'Internal Server Authorization Error',
        'AUTH_ERROR',
        error.message,
        500
      );
    }

    return await handler(req, context);
  };
}

export default withRoles;
