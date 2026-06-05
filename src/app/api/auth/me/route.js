import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getUserByToken } from '@/lib/auth';

export async function GET() {
  const token = (await cookies()).get('raillink_session')?.value;
  const user = getUserByToken(token);
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  return NextResponse.json({ data: user });
}
