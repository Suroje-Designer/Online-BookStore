import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { getErrorMessage } from '../services/api';
import Loader from '../components/Loader.jsx';
import StateMessage from '../components/StateMessage.jsx';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/categories')
      .then((r) => setCategories(r.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container section">
      <h1 className="page-title">Categories</h1>
      {loading ? (
        <Loader />
      ) : error ? (
        <StateMessage title="We couldn't load categories" tone="error">{error}</StateMessage>
      ) : categories.length === 0 ? (
        <StateMessage title="No categories yet">Categories will appear here once an admin adds them.</StateMessage>
      ) : (
        <div className="category-grid">
          {categories.map((c) => (
            <Link key={c._id} to={`/books?category=${c._id}`} className="category-card">
              <h3>{c.name}</h3>
              <p className="muted">{c.bookCount} book{c.bookCount === 1 ? '' : 's'}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
