import { NextResponse } from 'next/server';
import axios from 'axios';
import { labOrderService } from '@/lib/labOrderService';

/**
 * GET /api/v1/lab/active
 * Returns list of active diagnostic laboratories for doctor/receptionist selection.
 */
export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

    // Attempt to query the backend service
    try {
      const beRes = await axios.get(`${backendUrl}/api/v1/lab/active`, {
        headers: authHeader ? { Authorization: authHeader } : {}
      });
      if (beRes.data?.data?.labs || beRes.data?.labs) {
        return NextResponse.json(beRes.data);
      }
    } catch (beErr) {
      // Backend request failed or unauthorized, fallback to service
    }

    const labs = await labOrderService.listActiveLabs();
    return NextResponse.json({
      success: true,
      message: 'Active laboratories retrieved successfully',
      data: { labs }
    });
  } catch (err) {
    console.error('[API /api/v1/lab/active GET ERROR]:', err);
    return NextResponse.json(
      { success: false, message: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
