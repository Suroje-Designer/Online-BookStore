import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import StateMessage from '../components/StateMessage.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import api, { getErrorMessage } from '../services/api';
import { formatPrice } from '../utils/format';

const FIELDS = [
  ['fullName', 'Full name', 'name'],
  ['phone', 'Phone number', 'tel'],
  ['address', 'Street address', 'street-address'],
  ['city', 'City', 'address-level2'],
  ['postalCode', 'Postal code', 'postal-code'],
  ['country', 'Country', 'country-name'],
];

export default function Checkout() {
  const { user } = useAuth();
  const { items, subtotal, itemCount, refresh, loading } = useCart();
  const toast = useToast();
  const navigate = useNavigate();

  const [address, setAddress] = useState({ fullName: user?.name || '', phone: '', address: '', city: '', postalCode: '', country: '' });
  const [payment, setPayment] = useState('COD');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  if (items.length === 0 && !loading) {
    return (
      <div className="container section">
        <StateMessage title="Nothing to check out" action={<Link className="btn btn-primary" to="/books">Browse books</Link>}>
          Your cart is empty.
        </StateMessage>
      </div>
    );
  }

  const set = (k) => (e) => setAddress((a) => ({ ...a, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setFormError('');
    const next = {};
    FIELDS.forEach(([k, label]) => {
      if (!address[k].trim()) next[k] = `${label} is required`;
    });
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    try {
      const { data } = await api.post('/orders', { shippingAddress: address, paymentMethod: payment });
      await refresh(); // the server cleared the cart
      toast.success('Order placed. Thank you!');
      navigate('/orders', { replace: true, state: { placedId: data._id } });
    } catch (err) {
      setFormError(getErrorMessage(err));
      refresh(); // stock may have changed
      setBusy(false);
    }
  };

  return (
    <div className="container section">
      <h1 className="page-title">Checkout</h1>
      <form className="cart-layout" onSubmit={submit} noValidate>
        <div>
          <section className="card form-section">
            <h2>Shipping address</h2>
            <div className="form-grid">
              {FIELDS.map(([k, label, auto]) => (
                <div key={k} className={k === 'address' ? 'full' : ''}>
                  <label htmlFor={k}>{label}</label>
                  <input id={k} autoComplete={auto} value={address[k]} onChange={set(k)} aria-invalid={!!errors[k]} />
                  {errors[k] && <span className="form-error">{errors[k]}</span>}
                </div>
              ))}
            </div>
          </section>

          <section className="card form-section">
            <h2>Payment method</h2>
            <label className={payment === 'COD' ? 'option selected' : 'option'}>
              <input type="radio" name="payment" value="COD" checked={payment === 'COD'} onChange={() => setPayment('COD')} />
              <span><strong>Cash on delivery</strong><small>Pay when your books arrive.</small></span>
            </label>
            <label className={payment === 'ONLINE' ? 'option selected' : 'option'}>
              <input type="radio" name="payment" value="ONLINE" checked={payment === 'ONLINE'} onChange={() => setPayment('ONLINE')} />
              <span><strong>Online payment</strong><small>Demo only: no real payment is taken.</small></span>
            </label>
          </section>
        </div>

        <aside className="card summary">
          <h2>Order summary</h2>
          <ul className="summary-items">
            {items.map(({ book, quantity }) => (
              <li key={book._id}>
                <span>{quantity} x {book.title}</span>
                <span>{formatPrice(book.price * quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="summary-row"><span>Items ({itemCount})</span><span>{formatPrice(subtotal)}</span></div>
          <div className="summary-row"><span>Shipping</span><span>Free</span></div>
          <div className="summary-row summary-total"><span>Total</span><span>{formatPrice(subtotal)}</span></div>
          {formError && <p className="form-error" role="alert">{formError}</p>}
          <button className="btn btn-primary btn-block btn-lg" type="submit" disabled={busy}>
            {busy ? 'Placing order...' : `Place order - ${formatPrice(subtotal)}`}
          </button>
          <Link to="/cart" className="link center">Back to cart</Link>
        </aside>
      </form>
    </div>
  );
}
