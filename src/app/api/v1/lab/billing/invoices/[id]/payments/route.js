import { ApiResponse } from '@/utils/apiResponse';
import { withErrorHandler } from '@/utils/apiHandler';
import { withRoles } from '@/utils/authGuard';
import { labBillingService } from '@/services/labBillingService';
import { hasLabPermission, LAB_PERMISSIONS } from '@/constants/labRoles';

/**
 * POST /api/v1/lab/billing/invoices/[id]/payments
 * Record full or partial payment against an invoice.
 */
export const POST = withErrorHandler(
  withRoles(['lab', 'admin'], async (req, { params }) => {
    const labId = req.user?.labId || (req.user?.role === 'lab' ? req.user?.id : null);
    if (!labId) {
      return ApiResponse.error('Unauthorized: Laboratory identity missing from authenticated token', 401);
    }

    // Role check: Only user with manage_billing permission can record payments
    const labRole = req.headers.get('x-lab-role') || req.user?.labRole || req.user?.role;
    if (!hasLabPermission(labRole, LAB_PERMISSIONS.MANAGE_BILLING)) {
      return ApiResponse.error('Access Denied: You do not have permission to record payments.', 403);
    }

    const { id } = await params;
    const body = await req.json();

    const result = await labBillingService.recordPayment(labId, id, body, req.user);
    return ApiResponse.success(result, 'Payment recorded successfully', 201);
  })
);
