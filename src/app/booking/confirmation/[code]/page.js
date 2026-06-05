export default async function ConfirmationPage({ params }) {
  const { code } = await params;
  return (
    <section className="card">
      <h1 className="success">Booking Confirmed</h1>
      <p>Ticket code: <strong>{code}</strong></p>
      <p>QR Placeholder:</p>
      <div className="card" style={{ maxWidth: 180, textAlign: 'center' }}>QR</div>
      <p className="muted">Please save this code to view your ticket in booking history.</p>
    </section>
  );
}
