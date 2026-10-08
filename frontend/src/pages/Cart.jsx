import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import BookCover from '../components/BookCover.jsx';
import Loader from '../components/Loader.jsx';
import StateMessage from '../components/StateMessage.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { getErrorMessage } from '../services/api';
import { formatPrice } from '../utils/format';

export default function Cart() {
  const { items, subtotal, itemCount, loading, updateQuantity, removeItem, clearCart } = useCart();
  const toast = useToast();
  const navigate = useNavigate();
  const [busyId, setBusyId] = useState('');

  const run = async (bookId, fn, successMsg) => {
    setBusyId(bookId);
    try {
      await fn();
      if (successMsg) toast.success(successMsg);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusyId('');
    }
  };

  const handleClear = async () => {
    if (!window.confirm('Remove every book from your cart?')) return;
    run('all', clearCart, 'Cart cleared');
  };

  if (loading && items.length === 0) return <Loader label="Loading your cart..." />;

  if (items.length === 0) {
    return (
      <div className="container section">
        <h1 className="page-title">Your cart</h1>
        <StateMessage title="Your cart is empty" action={<Link className="btn btn-primary" to="/books">Browse books</Link>}>
          Add a few books and they will show up here.
        </StateMessage>
      </div>
    );
  }

  const hasProblem = items.some((i) => i.quantity > i.book.stock);

  return (
    <div className="container section">
      <h1 className="page-title">Your cart</h1>
      <div className="cart-layout">
        <ul className="cart-list">
          {items.map(({ book, quantity }) => {
            const busy = busyId === book._id || busyId === 'all';
            const over = quantity > book.stock;
            return (
              <li key={book._id} className="card cart-item">
                <Link to={`/books/${book._id}`} className="cart-cover"><BookCover book={book} /></Link>
                <div className="cart-info">
                  <h3><Link to={`/books/${book._id}`}>{book.title}</Link></h3>
                  <p className="muted">{book.author}</p>
                  <p className="price">{formatPrice(book.price)}</p>
                  {over && (
                    <p className="form-error">
                      {book.stock === 0 ? 'This book is now out of stock.' : `Only ${book.stock} left. Lower the quantity to continue.`}
                    </p>
                  )}
                </div>
                <div className="cart-actions">
                  <div className="qty">
                    <button
                      type="button"
                      aria-label={`Decrease quantity of ${book.title}`}
                      disabled={busy || quantity <= 1}
                      onClick={() => run(book._id, () => updateQuantity(book._id, quantity - 1))}
                    >-</button>
                    <span aria-live="polite">{quantity}</span>
                    <button
                      type="button"
                      aria-label={`Increase quantity of ${book.title}`}
                      disabled={busy || quantity >= book.stock}
                      onClick={() => run(book._id, () => updateQuantity(book._id, quantity + 1))}
                    >+</button>
                  </div>
                  <strong>{formatPrice(book.price * quantity)}</strong>
                  <button
                    className="btn btn-link-danger"
                    disabled={busy}
                    onClick={() => run(book._id, () => removeItem(book._id), 'Removed from cart')}
                  >Remove</button>
                </div>
              </li>
            );
          })}
          <li><button className="btn btn-ghost btn-sm" onClick={handleClear} disabled={busyId === 'all'}>Clear cart</button></li>
        </ul>

        <aside className="card summary">
          <h2>Order summary</h2>
          <div className="summary-row"><span>Items ({itemCount})</span><span>{formatPrice(subtotal)}</span></div>
          <div className="summary-row"><span>Shipping</span><span>Free</span></div>
          <div className="summary-row summary-total"><span>Total</span><span>{formatPrice(subtotal)}</span></div>
          <button className="btn btn-primary btn-block btn-lg" disabled={hasProblem} onClick={() => navigate('/checkout')}>
            Proceed to checkout
          </button>
          {hasProblem && <p className="muted small">Fix the stock issues above to continue.</p>}
          <Link to="/books" className="link center">Keep shopping</Link>
        </aside>
      </div>
    </div>
  );
}
