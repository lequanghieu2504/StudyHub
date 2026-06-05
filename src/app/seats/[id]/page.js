'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SeatSelectionPage({ params }) {
  const [detail, setDetail] = useState(null);
  const [selected, setSelected] = useState([]);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetch(`/api/schedules/${params.id}`)
      .then((res) => res.json())
      .then((json) => setDetail(json.data));
  }, [params.id]);

  const toggleSeat = (seat) => {
    if (seat.is_booked) return;
    setSelected((prev) =>
      prev.includes(seat.id) ? prev.filter((s) => s !== seat.id) : [...prev, seat.id]
    );
  };

  const continueBooking = () => {
    if (!selected.length) {
      setError('Please choose at least one seat.');
      return;
    }
    localStorage.setItem('booking_schedule_id', params.id);
    localStorage.setItem('booking_seat_ids', JSON.stringify(selected));
    router.push('/booking/passenger');
  };

  if (!detail) return <div className="card">Loading seats...</div>;

  return (
    <section className="card">
      <h1>Select Seats - {detail.train_name}</h1>
      <div className="seat-grid">
        {detail.seats.map((seat) => (
          <button
            key={seat.id}
            type="button"
            className={`seat ${seat.is_booked ? 'booked' : ''} ${selected.includes(seat.id) ? 'selected' : ''}`}
            onClick={() => toggleSeat(seat)}
          >
            {seat.seat_number}
          </button>
        ))}
      </div>
      {error && <p className="error">{error}</p>}
      <button onClick={continueBooking}>Continue</button>
    </section>
  );
}
