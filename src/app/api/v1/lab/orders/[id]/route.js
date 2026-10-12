import { NextResponse } from 'next/server';
import { labOrderService } from '@/lib/labOrderService';

function getAuthUser(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.split(' ')[1].trim();
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
    if (!payload || !payload.role) return null;
    const role = (payload.role || '').toLowerCase();
    const labId = payload.labId || (role === 'lab' ? payload.id : null);
    const doctorId = payload.doctorId || (role === 'doctor' ? payload.id : null);
    const receptionistId = payload.receptionistId || (role === 'receptionist' ? payload.id : null);
    const clinicId = payload.clinicId || (role === 'clinic' ? payload.id : null);
    return { id: payload.id, role, labId, doctorId, receptionistId, clinicId, email: payload.email };
  } catch (e) {
    return null;
  }
}

/**
 * GET /api/v1/lab/orders/[id]
 * View single order details with tenant-scoping verification.
 */
export async function GET(request, { params }) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Please login.' },
        { status: 401 }
      );
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Order ID is required' },
        { status: 400 }
      );
    }

    const order = await labOrderService.getOrderById(id, user);
    if (!order) {
      return NextResponse.json(
        { success: false, message: 'Lab order not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Lab order details retrieved successfully',
      data: { order }
    });
  } catch (err) {
    console.error('[API /api/v1/lab/orders/[id] GET ERROR]:', err);
    return NextResponse.json(
      { success: false, message: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
