import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import api, { getErrorMessage } from '../services/api';
import BookCover from '../components/BookCover.jsx';
import Loader from '../components/Loader.jsx';
import StateMessage from '../components/StateMessage.jsx';
import { Stars, StarInput } from '../components/Stars.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { formatDate, formatPrice } from '../utils/format';

export default function BookDetails() {
  const { id } = useParams();
  const { user, isAdmin } = useAuth();
  const { addToCart } = useCart();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [book, setBook] = useState(null);
  const [reviewData, setReviewData] = useState({ reviews: [], numReviews: 0, averageRating: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState('');

  const loadReviews = useCallback(async () => {
    const { data } = await api.get(`/reviews/book/${id}`);
    setReviewData(data);
  }, [id]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError('');
    Promise.all([api.get(`/books/${id}`), api.get(`/reviews/book/${id}`)])
      .then(([b, r]) => {
        if (!alive) return;
        setBook(b.data);
        setReviewData(r.data);
        setQty(1);
      })
      .catch((err) => alive && setError(err.response?.status === 404 ? 'This book could not be found.' : getErrorMessage(err)))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [id]);

  if (loading) return <Loader label="Loading book..." />;
  if (error || !book) {
    return (
      <div className="container section">
        <StateMessage title="Book unavailable" tone="error" action={<Link className="btn btn-primary" to="/books">Back to books</Link>}>
          {error}
        </StateMessage>
      </div>
    );
  }

  const soldOut = book.stock < 1;
  const myReview = user && reviewData.reviews.find((r) => r.user?._id === user._id);

  const handleAdd = async () => {
    if (!user) {
      toast.error('Log in to add books to your cart');
      navigate('/login', { state: { from: location.pathname } });
      return;
    }
    setAdding(true);
    try {
      await addToCart(book._id, qty);
      toast.success(`Added ${qty} x "${book.title}" to your cart`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setAdding(false);
    }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    setReviewError('');
    if (!rating) return setReviewError('Choose a star rating');
    if (!comment.trim()) return setReviewError('Write a short comment');
    setSubmitting(true);
    try {
      await api.post(`/reviews/book/${id}`, { rating, comment });
      await loadReviews();
      setRating(0);
      setComment('');
      toast.success('Thanks, your review has been posted');
    } catch (err) {
      setReviewError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const removeReview = async (reviewId) => {
    if (!window.confirm('Delete this review?')) return;
    try {
      await api.delete(`/reviews/${reviewId}`);
      await loadReviews();
      toast.success('Review deleted');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="container section">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link to="/books">Books</Link>
        {book.category && (
          <>
            <span>/</span>
            <Link to={`/books?category=${book.category._id}`}>{book.category.name}</Link>
          </>
        )}
      </nav>

      <div className="details">
        <BookCover book={book} className="details-cover" />

        <div className="details-info">
          <h1>{book.title}</h1>
          <p className="by">by {book.author}</p>
          <div className="rating-line">
            <Stars value={reviewData.averageRating} size="1.2rem" />
            <span className="muted">
              {reviewData.numReviews > 0
                ? `${reviewData.averageRating} out of 5 (${reviewData.numReviews} review${reviewData.numReviews === 1 ? '' : 's'})`
                : 'No reviews yet'}
            </span>
          </div>

          <p className="details-price">{formatPrice(book.price)}</p>
          <p>
            {soldOut ? (
              <span className="badge badge-danger">Out of stock</span>
            ) : book.stock <= 5 ? (
              <span className="badge badge-warn">Only {book.stock} left</span>
            ) : (
              <span className="badge badge-ok">In stock ({book.stock} available)</span>
            )}
          </p>

          <p className="details-desc">{book.description}</p>

          <dl className="meta">
            <div><dt>Category</dt><dd>{book.category?.name || 'Uncategorised'}</dd></div>
            <div><dt>ISBN</dt><dd>{book.ISBN}</dd></div>
          </dl>

          <div className="buy-row">
            <div className="qty" aria-label="Quantity">
              <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={soldOut || qty <= 1} aria-label="Decrease quantity">-</button>
              <span>{qty}</span>
              <button type="button" onClick={() => setQty((q) => Math.min(book.stock, q + 1))} disabled={soldOut || qty >= book.stock} aria-label="Increase quantity">+</button>
            </div>
            <button className="btn btn-primary btn-lg" onClick={handleAdd} disabled={soldOut || adding}>
              {soldOut ? 'Out of stock' : adding ? 'Adding...' : 'Add to cart'}
            </button>
          </div>
        </div>
      </div>

      <section className="reviews" aria-labelledby="reviews-title">
        <h2 id="reviews-title">Reader reviews</h2>

        {user ? (
          myReview ? (
            <p className="notice">You have already reviewed this book. You can delete your review below and post a new one.</p>
          ) : (
            <form className="card review-form" onSubmit={submitReview} noValidate>
              <h3>Write a review</h3>
              <StarInput value={rating} onChange={setRating} />
              <label htmlFor="comment" className="sr-only">Your review</label>
              <textarea
                id="comment"
                rows="4"
                maxLength="1000"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="What did you think of this book?"
              />
              {reviewError && <p className="form-error" role="alert">{reviewError}</p>}
              <button className="btn btn-primary" type="submit" disabled={submitting}>
                {submitting ? 'Posting...' : 'Post review'}
              </button>
            </form>
          )
        ) : (
          <p className="notice">
            <Link to="/login" state={{ from: location.pathname }}>Log in</Link> to review this book.
          </p>
        )}

        {reviewData.reviews.length === 0 ? (
          <StateMessage title="No reviews yet">Be the first to share your thoughts.</StateMessage>
        ) : (
          <ul className="review-list">
            {reviewData.reviews.map((r) => (
              <li key={r._id} className="card review">
                <div className="review-head">
                  <strong>{r.user?.name || 'Former user'}</strong>
                  <Stars value={r.rating} />
                  <span className="muted">{formatDate(r.createdAt)}</span>
                </div>
                <p>{r.comment}</p>
                {user && (user._id === r.user?._id || isAdmin) && (
                  <button className="btn btn-link-danger" onClick={() => removeReview(r._id)}>Delete</button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
