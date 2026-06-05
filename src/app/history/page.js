'use client';

import { useEffect, useState } from 'react';

export default function HistoryPage() {
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState('');

  const loadBookings = () => {
    fetch('/api/bookings')
      .then((res) => res.json().then((json) => ({ ok: res.ok, json })))
      .then(({ ok, json }) => {
        if (!ok) return setError(json.error || 'Unable to load bookings');
        setBookings(json.data);
      });
  };

  useEffect(loadBookings, []);

  const cancelBooking = async (id) => {
    const res = await fetch(`/api/bookings/${id}`, { method: 'DELETE' });
    if (res.ok) loadBookings();
  };

  return (
    <section className="card">
      <h1>Booking History</h1>
      {error && <p className="error">{error}</p>}
      {!error && bookings.length === 0 && <p>No bookings found.</p>}
      {bookings.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Code</th>
              <th>Route</th>
              <th>Date</th>
              <th>Price</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => (
              <tr key={booking.id}>
                <td>{booking.booking_code}</td>
                <td>{booking.route_name}</td>
                <td>{booking.travel_date}</td>
                <td>${booking.total_price}</td>
                <td>{booking.status}</td>
                <td>
                  {booking.status !== 'CANCELLED' ? (
                    <button type="button" className="danger" onClick={() => cancelBooking(booking.id)}>
                      Cancel
                    </button>
                  ) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
