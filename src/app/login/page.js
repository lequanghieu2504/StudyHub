'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [form, setForm] = useState({ email: 'user@raillink.local', password: 'demo123' });
  const [error, setError] = useState('');
  const router = useRouter();

  const submit = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error || 'Login failed');
    router.push('/profile');
  };

  return (
    <section className="card">
      <h1>Login</h1>
      <form className="grid" onSubmit={submit}>
        <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required />
        <input type="password" placeholder="Password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} required />
        {error && <p className="error">{error}</p>}
        <button type="submit">Login</button>
      </form>
      <p className="muted">Demo: user@raillink.local / demo123</p>
    </section>
  );
}
