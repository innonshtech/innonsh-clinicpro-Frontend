import { ApiResponse } from '@/utils/apiResponse';
import { withErrorHandler } from '@/utils/apiHandler';
import { withRoles } from '@/utils/authGuard';
import { labBillingService } from '@/services/labBillingService';

/**
 * GET /api/v1/lab/billing/invoices/[id]
 * Get single invoice with full line items and payment receipts.
 */
export const GET = withErrorHandler(
  withRoles(['lab', 'admin'], async (req, { params }) => {
    const labId = req.user?.labId || (req.user?.role === 'lab' ? req.user?.id : null);
    if (!labId) {
      return ApiResponse.error('Unauthorized: Laboratory identity missing from authenticated token', 401);
    }

    const { id } = await params;
    const invoice = await labBillingService.getInvoiceById(labId, id);

    if (!invoice) {
      return ApiResponse.error('Invoice not found or access denied', 404);
    }

    return ApiResponse.success({ invoice }, 'Invoice details retrieved successfully');
  })
);
