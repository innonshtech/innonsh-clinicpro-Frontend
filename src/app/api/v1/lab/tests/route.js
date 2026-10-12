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
 * GET /api/v1/lab/tests
 * Retrieves all tests for the authenticated laboratory.
 */
export async function GET(request) {
  try {
    const user = getAuthUser(request);
    if (!user || !user.labId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Please login as a laboratory.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';
    const department = searchParams.get('department') || 'all';

    const tests = await labTestService.listTests(user.labId, { search, status, department });
    return NextResponse.json({
      success: true,
      message: 'Tests retrieved successfully',
      data: { tests }
    });
  } catch (err) {
    console.error('[API /api/v1/lab/tests GET ERROR]:', err);
    return NextResponse.json(
      { success: false, message: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/lab/tests
 * Creates a new diagnostic test in the laboratory catalog.
 */
export async function POST(request) {
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

    const body = await request.json();
    const test = await labTestService.createTest(user.labId, body);

    return NextResponse.json(
      {
        success: true,
        message: 'Diagnostic test created successfully',
        data: { test }
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('[API /api/v1/lab/tests POST ERROR]:', err);
    if (err.code === 'DUPLICATE_CODE') {
      return NextResponse.json(
        { success: false, message: err.message, errorCode: 'DUPLICATE_CODE' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { success: false, message: err.message || 'Failed to create test' },
      { status: 400 }
    );
  }
}
