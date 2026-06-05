import { listStations } from '@/lib/services';

export default function HomePage() {
  const stations = listStations();

  return (
    <section>
      <div className="card">
        <h1>Book Your Train Tickets</h1>
        <p className="muted">Search trains, pick seats, and complete payment in a few steps.</p>
        <form action="/search" className="grid grid-cols-2">
          <label>
            Departure station
            <select name="from" required>
              <option value="">Select station</option>
              {stations.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </label>
          <label>
            Arrival station
            <select name="to" required>
              <option value="">Select station</option>
              {stations.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </label>
          <label>
            Travel date
            <input type="date" name="date" required />
          </label>
          <label>
            Number of passengers
            <input type="number" name="passengers" min="1" max="8" defaultValue="1" required />
          </label>
          <button type="submit">Search Trains</button>
        </form>
      </div>
      <div className="card">
        <h2>Booking Steps</h2>
        <ol>
          <li>1. Search available trains</li>
          <li>2. Choose train and seats</li>
          <li>3. Fill passenger info</li>
          <li>4. Confirm and pay</li>
        </ol>
      </div>
    </section>
  );
}
