import { NextResponse } from 'next/server';
import { loginUser } from '@/lib/auth';

export async function POST(request) {
  const body = await request.json();
  if (!body?.email || !body?.password) {
    return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
  }

  const result = loginUser(body);
  if (!result) return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });

  const response = NextResponse.json({ data: result.user });
  response.cookies.set('raillink_session', result.token, { httpOnly: true, sameSite: 'lax', path: '/' });
  return response;
}
