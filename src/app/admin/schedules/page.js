import AdminResourcePage from '@/components/AdminResourcePage';

export default function AdminSchedulesPage() {
  return <AdminResourcePage resource="schedules" title="Manage Schedules" fields={[
    { name: 'train_id', label: 'Train ID' },
    { name: 'route_id', label: 'Route ID' },
    { name: 'departure_time', label: 'Departure Time (HH:mm)' },
    { name: 'arrival_time', label: 'Arrival Time (HH:mm)' },
    { name: 'travel_date', label: 'Travel Date', type: 'date' },
    { name: 'seat_class', label: 'Seat Class' },
    { name: 'available_seats', label: 'Available Seats', type: 'number' },
    { name: 'price', label: 'Price', type: 'number' },
  ]} />;
}
