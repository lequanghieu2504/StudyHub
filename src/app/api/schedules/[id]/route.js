import { NextResponse } from 'next/server';
import { getScheduleDetails } from '@/lib/services';

export async function GET(_request, { params }) {
  const { id } = await params;
  const schedule = getScheduleDetails(id);
  if (!schedule) return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
  return NextResponse.json({ data: schedule });
}
