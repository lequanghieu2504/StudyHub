import AdminResourcePage from '@/components/AdminResourcePage';

export default function AdminStationsPage() {
  return <AdminResourcePage resource="stations" title="Manage Stations" fields={[
    { name: 'code', label: 'Code' },
    { name: 'name', label: 'Station Name' },
    { name: 'city', label: 'City' },
  ]} />;
}
