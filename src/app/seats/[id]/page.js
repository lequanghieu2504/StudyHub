'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { isUuid } from '@/lib/validation';

export default function SeatSelectionPage() {
  const routeParams = useParams();
  const scheduleId = routeParams?.id;
  const invalidSchedule = !isUuid(scheduleId);
  const [detail, setDetail] = useState(null);
  const [selected, setSelected] = useState([]);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (invalidSchedule) return;
    fetch(`/api/schedules/${scheduleId}`)
      .then((res) => res.json())
      .then((json) => setDetail(json.data))
      .catch(() => setError('Unable to load seat map. Please retry.'));
  }, [invalidSchedule, scheduleId]);

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
    localStorage.setItem('booking_schedule_id', scheduleId);
    localStorage.setItem('booking_seat_ids', JSON.stringify(selected));
    router.push('/booking/passenger');
  };

  if (invalidSchedule) return <div className="card error">Invalid schedule.</div>;
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
