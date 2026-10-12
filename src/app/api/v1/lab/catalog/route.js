import { NextResponse } from 'next/server';
import { labOrderService } from '@/lib/labOrderService';

/**
 * GET /api/v1/lab/catalog?labId=...
 * Returns active tests and packages offered by the selected laboratory.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const labId = searchParams.get('labId');
    if (!labId) {
      return NextResponse.json(
        { success: false, message: 'labId query parameter is required' },
        { status: 400 }
      );
    }

    const catalog = await labOrderService.getLabServices(labId);
    return NextResponse.json({
      success: true,
      message: 'Laboratory services retrieved successfully',
      data: catalog
    });
  } catch (err) {
    console.error('[API /api/v1/lab/catalog GET ERROR]:', err);
    return NextResponse.json(
      { success: false, message: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
