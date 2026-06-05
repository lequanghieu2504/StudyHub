'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PassengerInfoPage() {
  const [passengers, setPassengers] = useState([{ fullName: '', age: '', idNumber: '' }]);
  const [error, setError] = useState('');
  const router = useRouter();

  const updatePassenger = (index, field, value) => {
    setPassengers((prev) => prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)));
  };

  const addPassenger = () => {
    setPassengers((prev) => [...prev, { fullName: '', age: '', idNumber: '' }]);
  };

  const continueToSummary = () => {
    if (passengers.some((p) => !p.fullName || !p.age || !p.idNumber)) {
      setError('Please complete all passenger fields before continuing.');
      return;
    }
    setError('');
    localStorage.setItem('booking_passengers', JSON.stringify(passengers));
    router.push('/booking/summary');
  };

  return (
    <section className="card">
      <h1>Passenger Information</h1>
      {passengers.map((passenger, idx) => (
        <div key={idx} className="grid grid-cols-2">
          <label>
            Full name
            <input value={passenger.fullName} onChange={(e) => updatePassenger(idx, 'fullName', e.target.value)} required />
          </label>
          <label>
            Age
            <input type="number" min="1" value={passenger.age} onChange={(e) => updatePassenger(idx, 'age', e.target.value)} required />
          </label>
          <label>
            ID number
            <input value={passenger.idNumber} onChange={(e) => updatePassenger(idx, 'idNumber', e.target.value)} required />
          </label>
        </div>
      ))}
      <button type="button" className="secondary" onClick={addPassenger}>Add Passenger</button>
      {error && <p className="error">{error}</p>}
      <button type="button" onClick={continueToSummary}>Continue to Summary</button>
    </section>
  );
}
