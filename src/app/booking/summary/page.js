'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function BookingSummaryPage() {
  const [summary, setSummary] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const scheduleId = localStorage.getItem('booking_schedule_id');
    const seatIds = JSON.parse(localStorage.getItem('booking_seat_ids') || '[]');
    const passengers = JSON.parse(localStorage.getItem('booking_passengers') || '[]');
    if (!scheduleId || seatIds.length < 1 || passengers.length < 1) return;

    fetch(`/api/schedules/${scheduleId}`)
      .then((res) => res.json())
      .then((json) => {
        const schedule = json.data;
        const selectedSeats = schedule.seats.filter((seat) => seatIds.includes(seat.id));
        setSummary({ schedule, seatIds, selectedSeats, passengers, total: schedule.price * seatIds.length });
      });
  }, []);

  if (!summary) return <div className="card">No booking data found.</div>;

  return (
    <section className="card">
      <h1>Booking Summary</h1>
      <p>Route: {summary.schedule.origin_name} → {summary.schedule.destination_name}</p>
      <p>Train: {summary.schedule.train_name}</p>
      <p>Date: {summary.schedule.travel_date}</p>
      <p>Seats: {summary.selectedSeats.map((s) => s.seat_number).join(', ')}</p>
      <h3>Passengers</h3>
      <ul>
        {summary.passengers.map((p, idx) => (
          <li key={idx}>{p.fullName} (Age {p.age}) - {p.idNumber}</li>
        ))}
      </ul>
      <p><strong>Total: ${summary.total}</strong></p>
      <button type="button" onClick={() => router.push('/payment')}>Proceed to Payment</button>
    </section>
  );
}
