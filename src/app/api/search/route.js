import { NextResponse } from 'next/server';
import { searchSchedules } from '@/lib/services';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const results = searchSchedules({
    from: searchParams.get('from') || '',
    to: searchParams.get('to') || '',
    date: searchParams.get('date') || '',
    seatClass: searchParams.get('seatClass') || '',
    trainType: searchParams.get('trainType') || '',
    sortBy: searchParams.get('sortBy') || 'price_asc',
  });
  return NextResponse.json({ data: results });
}
