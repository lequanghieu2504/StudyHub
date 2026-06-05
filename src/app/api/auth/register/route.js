import { NextResponse } from 'next/server';
import { createUser } from '@/lib/auth';

export async function POST(request) {
  try {
    const body = await request.json();
    if (!body?.name || !body?.email || !body?.password) {
      return NextResponse.json({ error: 'Name, email and password are required.' }, { status: 400 });
    }
    const user = createUser(body);
    return NextResponse.json({ data: user }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Email already exists or invalid data.' }, { status: 400 });
  }
}
