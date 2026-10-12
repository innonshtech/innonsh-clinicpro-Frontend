import { NextResponse } from 'next/server';
import { ApiResponse } from '@/utils/apiResponse';
import { withErrorHandler } from '@/utils/apiHandler';
import { withRoles } from '@/utils/authGuard';
import { labBillingService } from '@/services/labBillingService';

/**
 * GET /api/v1/lab/billing/invoices/[id]/pdf
 * Stream/download official PDF tax invoice document.
 */
export const GET = withErrorHandler(
  withRoles(['lab', 'admin'], async (req, { params }) => {
    const labId = req.user?.labId || (req.user?.role === 'lab' ? req.user?.id : null);
    if (!labId) {
      return ApiResponse.error('Unauthorized: Laboratory identity missing from authenticated token', 401);
    }

    const { id } = await params;
    const { pdfBuffer, filename } = await labBillingService.generateInvoicePdfBuffer(labId, id);

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`,
        'Content-Length': String(pdfBuffer.length)
      }
    });
  })
);
