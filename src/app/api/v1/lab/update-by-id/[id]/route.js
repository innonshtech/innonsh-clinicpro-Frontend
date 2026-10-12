import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { formatTitleCase } from '@/utils/nameFormatting';

/**
 * PUT /api/v1/lab/update-by-id/[id]
 * Updates a laboratory record in Supabase.
 * Excludes password and credentials to prevent accidental exposure/overwrite.
 */
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Lab ID is required' }, { status: 400 });
    }

    const body = await request.json();

    // Map allowed editable fields strictly
    const updatePayload = {};

    if (body.labName !== undefined || body.lab_name !== undefined) {
      const rawName = body.labName !== undefined ? body.labName : body.lab_name;
      updatePayload.lab_name = formatTitleCase(rawName);
    }

    if (body.labType !== undefined || body.lab_type !== undefined) {
      updatePayload.lab_type = body.labType || body.lab_type || 'diagnostic';
    }

    if (body.description !== undefined) {
      updatePayload.description = body.description ? body.description.trim() : null;
    }

    if (body.logo !== undefined) {
      updatePayload.logo = body.logo || null;
    }

    if (body.phone !== undefined) {
      updatePayload.phone = (body.phone || '').trim();
    }

    if (body.email !== undefined) {
      updatePayload.email = (body.email || '').trim().toLowerCase();
    }

    if (body.website !== undefined) {
      updatePayload.website = body.website && typeof body.website === 'string' ? body.website.trim() : null;
    }

    if (body.address !== undefined) {
      updatePayload.address = (body.address || '').trim();
    }

    if (body.city !== undefined) {
      updatePayload.city = (body.city || '').trim();
    }

    if (body.state !== undefined) {
      updatePayload.state = (body.state || '').trim();
    }

    if (body.postalCode !== undefined || body.postal_code !== undefined) {
      updatePayload.postal_code = (body.postalCode || body.postal_code || '').trim();
    }

    if (body.country !== undefined) {
      updatePayload.country = (body.country || 'India').trim();
    }

    if (body.registrationNumber !== undefined || body.registration_number !== undefined) {
      const reg = body.registrationNumber || body.registration_number;
      updatePayload.registration_number = reg && typeof reg === 'string' ? reg.trim() : null;
    }

    if (body.taxId !== undefined || body.tax_id !== undefined) {
      const tax = body.taxId || body.tax_id;
      updatePayload.tax_id = tax && typeof tax === 'string' ? tax.trim() : null;
    }

    if (body.nablAccredited !== undefined || body.nabl_accredited !== undefined) {
      updatePayload.nabl_accredited = Boolean(body.nablAccredited ?? body.nabl_accredited);
    }

    if (body.homeCollectionAvailable !== undefined || body.home_collection_available !== undefined) {
      updatePayload.home_collection_available = Boolean(body.homeCollectionAvailable ?? body.home_collection_available);
    }

    if (body.operatingHours !== undefined || body.operating_hours !== undefined) {
      updatePayload.operating_hours = body.operatingHours || body.operating_hours || {};
    }

    if (body.status !== undefined) {
      updatePayload.status = body.status;
    }

    updatePayload.updated_at = new Date().toISOString();

    // NEVER update or touch password or login credentials
    delete updatePayload.password;
    delete updatePayload.login_email;
    delete updatePayload.loginEmail;

    const { data: updatedLab, error } = await supabase
      .from('labs')
      .update(updatePayload)
      .eq('id', id)
      .select('id, lab_name, lab_type, description, logo, phone, email, login_email, website, address, city, state, postal_code, country, registration_number, tax_id, license_document_url, nabl_accredited, home_collection_available, operating_hours, role, status, created_at, updated_at')
      .maybeSingle();

    if (error) {
      console.error('[LAB UPDATE API ERROR] Supabase update error:', error);
      return NextResponse.json({ success: false, error: error.message || 'Failed to update laboratory record' }, { status: 500 });
    }

    if (!updatedLab) {
      return NextResponse.json({ success: false, error: 'Laboratory not found' }, { status: 404 });
    }

    const safeLab = {
      ...updatedLab,
      _id: updatedLab.id,
      labName: updatedLab.lab_name,
      labType: updatedLab.lab_type,
      postalCode: updatedLab.postal_code,
      registrationNumber: updatedLab.registration_number,
      taxId: updatedLab.tax_id,
      nablAccredited: updatedLab.nabl_accredited,
      homeCollectionAvailable: updatedLab.home_collection_available,
      operatingHours: updatedLab.operating_hours,
      createdAt: updatedLab.created_at,
      updatedAt: updatedLab.updated_at
    };
    delete safeLab.password;

    return NextResponse.json({
      success: true,
      message: 'Laboratory updated successfully',
      data: { lab: safeLab }
    });
  } catch (err) {
    console.error('[LAB UPDATE API ERROR]:', err);
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}
