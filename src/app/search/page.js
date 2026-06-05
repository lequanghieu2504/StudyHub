import Link from 'next/link';
import { searchSchedules } from '@/lib/services';

export default async function SearchPage({ searchParams }) {
  const currentSearchParams = await searchParams;
  const params = {
    from: currentSearchParams?.from || '',
    to: currentSearchParams?.to || '',
    date: currentSearchParams?.date || '',
    seatClass: currentSearchParams?.seatClass || '',
    trainType: currentSearchParams?.trainType || '',
    sortBy: currentSearchParams?.sortBy || 'price_asc',
  };

  const trains = searchSchedules(params);

  return (
    <section>
      <div className="card">
        <h1>Available Trains</h1>
        <form className="grid grid-cols-2" action="/search">
          {Object.entries(currentSearchParams || {}).map(([key, value]) => (
            ['from', 'to', 'date'].includes(key) ? <input key={key} type="hidden" name={key} defaultValue={value} /> : null
          ))}
          <label>
            Seat class
            <select name="seatClass" defaultValue={params.seatClass}>
              <option value="">All</option>
              <option value="Economy">Economy</option>
              <option value="Business">Business</option>
            </select>
          </label>
          <label>
            Train type
            <select name="trainType" defaultValue={params.trainType}>
              <option value="">All</option>
              <option value="Express">Express</option>
              <option value="Local">Local</option>
            </select>
          </label>
          <label>
            Sort by
            <select name="sortBy" defaultValue={params.sortBy}>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="departure_asc">Departure Time</option>
              <option value="arrival_asc">Arrival Time</option>
            </select>
          </label>
          <button type="submit">Apply Filters</button>
        </form>
      </div>

      <div className="card">
        {trains.length === 0 ? (
          <p>No trains found for this search.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Train</th>
                <th>Route</th>
                <th>Time</th>
                <th>Duration</th>
                <th>Seat Class</th>
                <th>Available</th>
                <th>Price</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {trains.map((train) => (
                <tr key={train.id}>
                  <td>{train.train_name}</td>
                  <td>{train.origin_name} → {train.destination_name}</td>
                  <td>{train.departure_time} - {train.arrival_time}</td>
                  <td>{train.duration}</td>
                  <td>{train.seat_class}</td>
                  <td>{train.available_seats}</td>
                  <td>${train.price}</td>
                  <td><Link className="btn" href={`/trains/${train.id}`}>Details</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
