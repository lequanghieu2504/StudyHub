import AdminResourcePage from '@/components/AdminResourcePage';

export default function AdminPricesPage() {
  return <AdminResourcePage resource="prices" title="Manage Ticket Prices" fields={[
    { name: 'route_id', label: 'Route ID' },
    { name: 'seat_class', label: 'Seat Class' },
    { name: 'price', label: 'Price', type: 'number' },
  ]} />;
}
