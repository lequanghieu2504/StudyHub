'use client';

import { useEffect, useState } from 'react';

export default function AdminStatisticsPage() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetch('/api/admin/statistics')
      .then((res) => res.json())
      .then((json) => setStats(json.data));
  }, []);

  if (!stats) return <div className="card">Loading statistics...</div>;

  return (
    <section className="card">
      <h1>Booking Statistics</h1>
      <p>Total bookings: {stats.totalBookings}</p>
      <p>Confirmed revenue: ${Number(stats.revenue).toFixed(2)}</p>
      <p>Cancelled bookings: {stats.cancelled}</p>
    </section>
  );
}
