import { NextResponse } from 'next/server';
import { labPackageService } from '@/lib/labPackageService';
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
 * GET /api/v1/lab/packages
 * Retrieves packages scoped strictly to the authenticated laboratory.
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

    const packages = await labPackageService.listPackages(user.labId, { search, status });
    return NextResponse.json({
      success: true,
      message: 'Packages retrieved successfully',
      data: { packages }
    });
  } catch (err) {
    console.error('[API /api/v1/lab/packages GET ERROR]:', err);
    return NextResponse.json(
      { success: false, message: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/lab/packages
 * Creates a new test package for the authenticated laboratory.
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
        { success: false, message: 'Access Denied: Technicians and Pathologists have view-only access to test packages.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const pkg = await labPackageService.createPackage(user.labId, body);

    return NextResponse.json(
      {
        success: true,
        message: 'Test package created successfully',
        data: { package: pkg }
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('[API /api/v1/lab/packages POST ERROR]:', err);
    if (err.code === 'DUPLICATE_CODE') {
      return NextResponse.json(
        { success: false, message: err.message, errorCode: 'DUPLICATE_CODE' },
        { status: 409 }
      );
    }
    if (err.code === 'INVALID_TEST_SELECTION' || err.status === 403) {
      return NextResponse.json(
        { success: false, message: err.message, errorCode: 'INVALID_TEST_SELECTION' },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { success: false, message: err.message || 'Failed to create test package' },
      { status: 400 }
    );
  }
}
