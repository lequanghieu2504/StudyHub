import AdminResourcePage from '@/components/AdminResourcePage';

export default function AdminRoutesPage() {
  return <AdminResourcePage resource="routes" title="Manage Routes" fields={[
    { name: 'name', label: 'Route Name' },
    { name: 'origin_station_id', label: 'Origin Station ID' },
    { name: 'destination_station_id', label: 'Destination Station ID' },
    { name: 'distance_km', label: 'Distance (km)', type: 'number' },
    { name: 'train_type', label: 'Train Type' },
  ]} />;
}
