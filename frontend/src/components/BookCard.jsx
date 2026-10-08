import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import BookCover from './BookCover.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { getErrorMessage } from '../services/api';
import { formatPrice } from '../utils/format';

export default function BookCard({ book }) {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [busy, setBusy] = useState(false);
  const soldOut = book.stock < 1;

  const handleAdd = async () => {
    if (!user) {
      toast.error('Log in to add books to your cart');
      navigate('/login', { state: { from: location.pathname + location.search } });
      return;
    }
    setBusy(true);
    try {
      await addToCart(book._id, 1);
      toast.success(`Added "${book.title}" to your cart`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="book-card">
      <Link to={`/books/${book._id}`} className="book-card-cover" aria-label={`View ${book.title}`}>
        <BookCover book={book} />
      </Link>
      <div className="book-card-body">
        {book.category?.name && <span className="chip">{book.category.name}</span>}
        <h3>
          <Link to={`/books/${book._id}`}>{book.title}</Link>
        </h3>
        <p className="muted">{book.author}</p>
        <div className="book-card-foot">
          <span className="price">{formatPrice(book.price)}</span>
          {soldOut ? (
            <span className="badge badge-danger">Out of stock</span>
          ) : book.stock <= 5 ? (
            <span className="badge badge-warn">Only {book.stock} left</span>
          ) : null}
        </div>
        <button className="btn btn-primary btn-block" onClick={handleAdd} disabled={soldOut || busy}>
          {soldOut ? 'Out of stock' : busy ? 'Adding...' : 'Add to cart'}
        </button>
      </div>
    </article>
  );
}
