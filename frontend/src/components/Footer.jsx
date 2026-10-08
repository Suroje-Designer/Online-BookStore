import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div>
          <strong className="footer-brand">Pageturn</strong>
          <p>Books for every kind of reader, delivered to your door.</p>
        </div>
        <nav className="footer-links" aria-label="Footer">
          <Link to="/books">Browse books</Link>
          <Link to="/categories">Categories</Link>
          <Link to="/orders">Your orders</Link>
        </nav>
        <p className="footer-note">&copy; {new Date().getFullYear()} Pageturn. College project demo.</p>
      </div>
    </footer>
  );
}
