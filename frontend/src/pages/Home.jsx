import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { getErrorMessage } from '../services/api';
import BookCard from '../components/BookCard.jsx';
import Loader from '../components/Loader.jsx';
import StateMessage from '../components/StateMessage.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const SPINES = [
  { h: 150, c: '#7A2E3A', w: 34 },
  { h: 185, c: '#E9A93B', w: 44 },
  { h: 135, c: '#2B4C7E', w: 30 },
  { h: 170, c: '#3F5D3A', w: 38 },
  { h: 195, c: '#F6F7F5', w: 46 },
  { h: 145, c: '#8A4B1E', w: 32 },
  { h: 175, c: '#4A3B6B', w: 40 },
];

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [latest, setLatest] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    let alive = true;
    Promise.all([
      api.get('/books', { params: { featured: true, limit: 4 } }),
      api.get('/books', { params: { sort: 'newest', limit: 8 } }),
      api.get('/categories'),
    ])
      .then(([f, l, c]) => {
        if (!alive) return;
        setFeatured(f.data);
        setLatest(l.data);
        setCategories(c.data);
      })
      .catch((err) => alive && setError(getErrorMessage(err)))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const onSearch = (e) => {
    e.preventDefault();
    navigate(q.trim() ? `/books?search=${encodeURIComponent(q.trim())}` : '/books');
  };

  return (
    <>
      <section className="hero">
        <div className="container hero-inner">
          <div className="hero-copy">
            <h1>Your next favourite book is already on the shelf.</h1>
            <p>
              Browse novels, memoirs, tech manuals and more. Order in a few taps and we will bring them to your door.
            </p>
            <form className="hero-search" onSubmit={onSearch} role="search">
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by title or author"
                aria-label="Search books"
              />
              <button className="btn btn-accent" type="submit">Search</button>
            </form>
            <div className="hero-cta">
              <Link to="/books" className="btn btn-light">Browse all books</Link>
              {!user && <Link to="/register" className="btn btn-outline-light">Create an account</Link>}
            </div>
          </div>
          <div className="shelf" aria-hidden="true">
            <div className="spines">
              {SPINES.map((s, i) => (
                <span key={i} className="spine" style={{ height: s.h, width: s.w, background: s.c }} />
              ))}
            </div>
            <div className="shelf-board" />
          </div>
        </div>
      </section>

      {loading ? (
        <Loader label="Loading the shelves..." />
      ) : error ? (
        <div className="container section">
          <StateMessage title="We couldn't load the store" tone="error">{error}</StateMessage>
        </div>
      ) : (
        <>
          <section className="container section">
            <div className="section-head">
              <h2>Shop by category</h2>
              <Link to="/categories" className="link">All categories</Link>
            </div>
            <div className="chip-row">
              {categories.map((c) => (
                <Link key={c._id} className="chip chip-lg" to={`/books?category=${c._id}`}>
                  {c.name}
                </Link>
              ))}
            </div>
          </section>

          <section className="container section">
            <div className="section-head">
              <h2>Featured books</h2>
              <Link to="/books" className="link">View all</Link>
            </div>
            {featured.length === 0 ? (
              <StateMessage title="No featured books yet">Check back soon.</StateMessage>
            ) : (
              <div className="book-grid">{featured.map((b) => <BookCard key={b._id} book={b} />)}</div>
            )}
          </section>

          <section className="container section">
            <div className="section-head">
              <h2>Latest arrivals</h2>
              <Link to="/books?sort=newest" className="link">See more</Link>
            </div>
            {latest.length === 0 ? (
              <StateMessage title="The shelves are empty">
                Run the seed script or add books from the admin area.
              </StateMessage>
            ) : (
              <div className="book-grid">{latest.map((b) => <BookCard key={b._id} book={b} />)}</div>
            )}
          </section>

          <section className="container section">
            <div className="cta-band">
              <div>
                <h2>Free shipping on orders you will love</h2>
                <p>Pay on delivery or online. Cancel any time before your order ships.</p>
              </div>
              <Link to="/books" className="btn btn-accent">Start shopping</Link>
            </div>
          </section>
        </>
      )}
    </>
  );
}
