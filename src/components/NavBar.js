import Link from 'next/link';

const links = [
  { href: '/', label: 'Home' },
  { href: '/history', label: 'My Bookings' },
  { href: '/profile', label: 'Profile' },
  { href: '/login', label: 'Login' },
  { href: '/register', label: 'Register' },
  { href: '/admin', label: 'Admin' },
];

export default function NavBar() {
  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link href="/" className="brand">RailLink</Link>
        <nav className="nav-links">
          {links.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
