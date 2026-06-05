import Link from 'next/link';
import { getScheduleDetails } from '@/lib/services';

export default async function TrainDetailPage({ params }) {
  const { id } = await params;
  const detail = getScheduleDetails(id);
  if (!detail) return <p className="card">Train schedule not found.</p>;

  return (
    <section className="card">
      <h1>{detail.train_name}</h1>
      <p>{detail.origin_name} → {detail.destination_name}</p>
      <p>Route: {detail.route_name}</p>
      <p>Time: {detail.departure_time} - {detail.arrival_time} ({detail.travel_date})</p>
      <p>Class: {detail.seat_class} | Available seats: {detail.available_seats}</p>
      <p>Price: ${detail.price} per seat</p>
      <h3>Seat availability snapshot</h3>
      <div className="seat-grid">
        {detail.seats.slice(0, 20).map((seat) => (
          <span className={`seat ${seat.is_booked ? 'booked' : ''}`} key={seat.id}>{seat.seat_number}</span>
        ))}
      </div>
      <p className="muted">Book now to choose seats.</p>
      <Link href={`/seats/${id}`} className="btn">Select Seats</Link>
    </section>
  );
}
