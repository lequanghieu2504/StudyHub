import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getUserByToken } from '@/lib/auth';
import { cancelBooking } from '@/lib/services';

export async function DELETE(_request, { params }) {
  try {
    const { id } = await params;
    const token = (await cookies()).get('raillink_session')?.value;
    const user = getUserByToken(token);
    if (!user) return NextResponse.json({ error: 'Please login first.' }, { status: 401 });

    const result = cancelBooking(id, user.id);
    return NextResponse.json({ data: result });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Unable to cancel booking.' }, { status: 400 });
  }
}
