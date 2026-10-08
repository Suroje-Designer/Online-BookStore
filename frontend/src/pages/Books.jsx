import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api, { getErrorMessage } from '../services/api';
import BookCard from '../components/BookCard.jsx';
import Loader from '../components/Loader.jsx';
import StateMessage from '../components/StateMessage.jsx';

export default function Books() {
  const [params, setParams] = useSearchParams();
  const search = params.get('search') || '';
  const category = params.get('category') || '';
  const sort = params.get('sort') || 'newest';

  const [text, setText] = useState(search);
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const update = (changes) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    setParams(next, { replace: true });
  };

  // Keep the box in sync when the URL changes elsewhere (e.g. from the home page search).
  useEffect(() => {
  setText(search);
}, [search]);

  // Debounce typing into the URL.
  useEffect(() => {
    if (text.trim() === search) return undefined;
    const t = setTimeout(() => update({ search: text.trim() }), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  useEffect(() => {
    api.get('/categories').then((r) => setCategories(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError('');
    api
      .get('/books', { params: { search: search || undefined, category: category || undefined, sort } })
      .then((r) => alive && setBooks(r.data))
      .catch((err) => alive && setError(getErrorMessage(err)))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [search, category, sort, reloadKey]);

  const clearFilters = () => {
    setText('');
    setParams({}, { replace: true });
  };
  const hasFilters = search || category;

  return (
    <div className="container section">
      <h1 className="page-title">Books</h1>

      <div className="filters">
        <input
          type="search"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Search by title or author"
          aria-label="Search books"
        />
        <select value={category} onChange={(e) => update({ category: e.target.value })} aria-label="Filter by category">
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>{c.name}</option>
          ))}
        </select>
        <select value={sort} onChange={(e) => update({ sort: e.target.value === 'newest' ? '' : e.target.value })} aria-label="Sort books">
          <option value="newest">Newest first</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
          <option value="title">Title A-Z</option>
        </select>
      </div>

      {loading ? (
        <Loader label="Finding books..." />
      ) : error ? (
        <StateMessage
          title="We couldn't load the books"
          tone="error"
          action={<button className="btn btn-primary" onClick={() => setReloadKey((k) => k + 1)}>Try again</button>}
        >
          {error}
        </StateMessage>
      ) : books.length === 0 ? (
        <StateMessage
          title="No books match your search"
          action={hasFilters ? <button className="btn btn-primary" onClick={clearFilters}>Clear filters</button> : null}
        >
          Try a different title, author or category.
        </StateMessage>
      ) : (
        <>
          <p className="muted result-count">{books.length} book{books.length === 1 ? '' : 's'}</p>
          <div className="book-grid">{books.map((b) => <BookCard key={b._id} book={b} />)}</div>
        </>
      )}
    </div>
  );
}
