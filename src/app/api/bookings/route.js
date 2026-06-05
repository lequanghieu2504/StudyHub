import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createBooking, listUserBookings } from '@/lib/services';
import { getUserByToken } from '@/lib/auth';

export async function GET() {
  const token = (await cookies()).get('raillink_session')?.value;
  const user = getUserByToken(token);
  if (!user) return NextResponse.json({ error: 'Please login first.' }, { status: 401 });
  const data = listUserBookings(user.id);
  return NextResponse.json({ data });
}

export async function POST(request) {
  try {
    const token = (await cookies()).get('raillink_session')?.value;
    const user = getUserByToken(token);
    if (!user) return NextResponse.json({ error: 'Please login first.' }, { status: 401 });

    const body = await request.json();
    if (!body.scheduleId || !Array.isArray(body.seatIds) || body.seatIds.length < 1) {
      return NextResponse.json({ error: 'Schedule and seats are required.' }, { status: 400 });
    }
    if (!Array.isArray(body.passengers) || body.passengers.length < 1) {
      return NextResponse.json({ error: 'Passenger information is required.' }, { status: 400 });
    }

    const booking = createBooking({
      userId: user.id,
      scheduleId: body.scheduleId,
      seatIds: body.seatIds,
      passengers: body.passengers,
      paymentMethod: body.paymentMethod,
    });

    return NextResponse.json({ data: booking }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Booking failed.' }, { status: 400 });
  }
}
