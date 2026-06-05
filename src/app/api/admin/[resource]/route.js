import { NextResponse } from 'next/server';
import { getAdminTable, createAdminResource, getBookingStatistics } from '@/lib/services';

export async function GET(request, { params }) {
  const { resource } = await params;
  if (resource === 'statistics') {
    return NextResponse.json({ data: getBookingStatistics() });
  }

  try {
    const data = getAdminTable(resource === 'prices' ? 'ticket_prices' : resource);
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function POST(request, { params }) {
  try {
    const { resource } = await params;
    const body = await request.json();
    const result = createAdminResource(resource === 'prices' ? 'ticket_prices' : resource, body);
    return NextResponse.json({ data: result }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Unable to create resource.' }, { status: 400 });
  }
}
