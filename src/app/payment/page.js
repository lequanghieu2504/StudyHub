'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PaymentPage() {
  const [method, setMethod] = useState('Credit Card');
  const [error, setError] = useState('');
  const router = useRouter();

  const payNow = async () => {
    const scheduleId = localStorage.getItem('booking_schedule_id');
    const seatIds = JSON.parse(localStorage.getItem('booking_seat_ids') || '[]');
    const passengers = JSON.parse(localStorage.getItem('booking_passengers') || '[]');

    const response = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scheduleId, seatIds, passengers, paymentMethod: method }),
    });

    const data = await response.json();
    if (!response.ok) {
      setError(data.error || 'Payment failed.');
      return;
    }

    localStorage.removeItem('booking_schedule_id');
    localStorage.removeItem('booking_seat_ids');
    localStorage.removeItem('booking_passengers');
    router.push(`/booking/confirmation/${data.data.booking_code}`);
  };

  return (
    <section className="card">
      <h1>Payment (Simulated)</h1>
      <label>
        Payment method
        <select value={method} onChange={(e) => setMethod(e.target.value)}>
          <option>Credit Card</option>
          <option>Bank Transfer</option>
          <option>E-Wallet</option>
        </select>
      </label>
      <p className="muted">This page simulates successful payment for demo purposes.</p>
      {error && <p className="error">{error}</p>}
      <button type="button" onClick={payNow}>Pay & Confirm</button>
    </section>
  );
}
