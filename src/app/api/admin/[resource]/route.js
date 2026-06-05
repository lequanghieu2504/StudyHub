import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAdminTable, createAdminResource, getBookingStatistics } from '@/lib/services';
import { getUserByToken } from '@/lib/auth';

const resolveResource = (resource) => (resource === 'prices' ? 'ticket_prices' : resource);

async function requireAdmin() {
  const token = (await cookies()).get('raillink_session')?.value;
  const user = getUserByToken(token);
  return user?.role === 'admin';
}

export async function GET(request, { params }) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  }
  const { resource } = await params;
  if (resource === 'statistics') {
    return NextResponse.json({ data: getBookingStatistics() });
  }

  try {
    const data = getAdminTable(resolveResource(resource));
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function POST(request, { params }) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  }
  try {
    const { resource } = await params;
    const body = await request.json();
    const result = createAdminResource(resolveResource(resource), body);
    return NextResponse.json({ data: result }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Unable to create resource.' }, { status: 400 });
  }
}
