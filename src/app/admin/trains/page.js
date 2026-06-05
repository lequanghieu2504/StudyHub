import AdminResourcePage from '@/components/AdminResourcePage';

export default function AdminTrainsPage() {
  return <AdminResourcePage resource="trains" title="Manage Trains" fields={[
    { name: 'name', label: 'Train Name' },
    { name: 'train_type', label: 'Train Type' },
    { name: 'total_seats', label: 'Total Seats', type: 'number' },
  ]} />;
}
