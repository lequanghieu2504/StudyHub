'use client';

import { useEffect, useState } from 'react';

export default function ProfilePage() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((json) => setUser(json.data || null));
  }, []);

  return (
    <section className="card">
      <h1>User Profile</h1>
      {!user ? (
        <p>Please login to view your profile.</p>
      ) : (
        <div>
          <p>Name: {user.name}</p>
          <p>Email: {user.email}</p>
          <p>Role: {user.role}</p>
        </div>
      )}
    </section>
  );
}
