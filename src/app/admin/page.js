import Link from 'next/link';

const cards = [
  ['stations', 'Manage Stations'],
  ['routes', 'Manage Routes'],
  ['trains', 'Manage Trains'],
  ['schedules', 'Manage Schedules'],
  ['prices', 'Manage Ticket Prices'],
  ['bookings', 'Manage Bookings'],
  ['statistics', 'View Statistics'],
];

export default function AdminDashboardPage() {
  return (
    <section className="card">
      <h1>Admin Dashboard</h1>
      <div className="grid grid-cols-2">
        {cards.map(([path, label]) => (
          <Link key={path} className="btn secondary" href={`/admin/${path}`}>{label}</Link>
        ))}
      </div>
    </section>
  );
}
