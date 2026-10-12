import { NextResponse } from 'next/server';
import { labTestService } from '@/lib/labTestService';
import { isLabAdmin } from '@/constants/labRoles';

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
    if (role !== 'lab' && role !== 'admin') return null;
    const labId = payload.labId || payload.id || payload._id;
    return {
      labId,
      role,
      id: payload.id || payload._id,
      labRole: payload.labRole,
      permissions: payload.permissions,
      isStaff: payload.isStaff
    };
  } catch (e) {
    return null;
  }
}

/**
 * GET /api/v1/lab/tests/[id]
 * View details of a test, strictly scoped to authenticated lab.
 */
export async function GET(request, { params }) {
  try {
    const user = getAuthUser(request);
    if (!user || !user.labId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Please login as a laboratory.' },
        { status: 401 }
      );
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Test ID is required' },
        { status: 400 }
      );
    }

    const test = await labTestService.getTestById(user.labId, id);
    if (!test) {
      return NextResponse.json(
        { success: false, message: 'Diagnostic test not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Test details retrieved successfully',
      data: { test }
    });
  } catch (err) {
    console.error('[API /api/v1/lab/tests/[id] GET ERROR]:', err);
    return NextResponse.json(
      { success: false, message: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/v1/lab/tests/[id]
 * Update a test or toggle its status (activate/deactivate).
 */
export async function PUT(request, { params }) {
  return handleUpdate(request, { params });
}

export async function PATCH(request, { params }) {
  return handleUpdate(request, { params });
}

async function handleUpdate(request, { params }) {
  try {
    const user = getAuthUser(request);
    if (!user || !user.labId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Please login as a laboratory.' },
        { status: 401 }
      );
    }

    if (!isLabAdmin(user)) {
      return NextResponse.json(
        { success: false, message: 'Access Denied: Technicians and Pathologists have view-only access to the test catalog.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Test ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const updatedTest = await labTestService.updateTest(user.labId, id, body);

    return NextResponse.json({
      success: true,
      message: 'Diagnostic test updated successfully',
      data: { test: updatedTest }
    });
  } catch (err) {
    console.error('[API /api/v1/lab/tests/[id] UPDATE ERROR]:', err);
    if (err.code === 'DUPLICATE_CODE') {
      return NextResponse.json(
        { success: false, message: err.message, errorCode: 'DUPLICATE_CODE' },
        { status: 409 }
      );
    }
    if (err.status === 404) {
      return NextResponse.json(
        { success: false, message: err.message || 'Test not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { success: false, message: err.message || 'Failed to update test' },
      { status: 400 }
    );
  }
}
