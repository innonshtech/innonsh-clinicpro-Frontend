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
    const clinicId = payload.clinicId || (role === 'clinic' ? payload.id : null);
    return { id: payload.id, role, labId, doctorId, clinicId, email: payload.email };
  } catch (e) {
    return null;
  }
}

/**
 * PUT/PATCH /api/v1/lab/orders/[id]/status
 * Updates status to 'accepted' or 'rejected'. Strictly scoped to destination laboratory.
 */
export async function PUT(request, { params }) {
  return handleStatusUpdate(request, { params });
}

export async function PATCH(request, { params }) {
  return handleStatusUpdate(request, { params });
}

async function handleStatusUpdate(request, { params }) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Please login as a laboratory.' },
        { status: 401 }
      );
    }

    const role = (user.role || '').toLowerCase();
    if (role !== 'lab' && role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Forbidden. Only laboratories can update order status.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Order ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { status, rejection_reason } = body;
    if (!status) {
      return NextResponse.json(
        { success: false, message: 'Status is required (accepted or rejected)' },
        { status: 400 }
      );
    }

    const updatedOrder = await labOrderService.updateOrderStatus(id, status, user, rejection_reason);

    return NextResponse.json({
      success: true,
      message: `Order status updated to ${status}`,
      data: { order: updatedOrder }
    });
  } catch (err) {
    console.error('[API /api/v1/lab/orders/[id]/status ERROR]:', err);
    const status = err.status || 400;
    return NextResponse.json(
      { success: false, message: err.message || 'Failed to update order status' },
      { status }
    );
  }
}
