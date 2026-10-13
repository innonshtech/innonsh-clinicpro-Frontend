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
 * GET /api/v1/lab/orders
 * Returns list of orders scoped strictly to caller's role (Doctor/Receptionist/Clinic or Lab).
 */
export async function GET(request) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Please provide a valid auth token.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';

    const orders = await labOrderService.listOrders({ search, status }, user);
    return NextResponse.json({
      success: true,
      message: 'Lab orders retrieved successfully',
      data: { orders }
    });
  } catch (err) {
    console.error('[API /api/v1/lab/orders GET ERROR]:', err);
    return NextResponse.json(
      { success: false, message: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/lab/orders
 * Creates a new diagnostic order (ONLY for Doctor or Receptionist. Clinic is forbidden).
 */
export async function POST(request) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Please login.' },
        { status: 401 }
      );
    }

    const role = (user.role || '').toLowerCase();
    if (role !== 'doctor' && role !== 'receptionist') {
      return NextResponse.json(
        { success: false, message: 'Forbidden. Only Doctors and Receptionists can create lab orders.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const order = await labOrderService.createOrder(body, user);

    return NextResponse.json(
      {
        success: true,
        message: 'Lab order created successfully',
        data: { order }
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('[API /api/v1/lab/orders POST ERROR]:', err);
    return NextResponse.json(
      { success: false, message: err.message || 'Failed to create lab order' },
      { status: 400 }
    );
  }
}
