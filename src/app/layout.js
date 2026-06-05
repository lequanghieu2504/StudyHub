import './globals.css';
import NavBar from '@/components/NavBar';

export const metadata = {
  title: 'RailLink - Train Ticket Booking',
  description: 'Online train ticket booking platform for customers and administrators.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <NavBar />
        <main className="container">{children}</main>
      </body>
    </html>
  );
}
