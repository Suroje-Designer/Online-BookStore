import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Loader from '../components/Loader.jsx';
import StateMessage from '../components/StateMessage.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { useToast } from '../context/ToastContext.jsx';
import api, { getErrorMessage } from '../services/api';
import { formatDate, formatPrice, shortId } from '../utils/format';

export default function Orders() {
  const location = useLocation();
  const placedId = location.state?.placedId;
  const toast = useToast();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openId, setOpenId] = useState(placedId || '');
  const [cancelling, setCancelling] = useState('');

  useEffect(() => {
    let alive = true;
    api
      .get('/orders/myorders')
      .then((r) => alive && setOrders(r.data))
      .catch((err) => alive && setError(getErrorMessage(err)))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const cancel = async (id) => {
    if (!window.confirm('Cancel this order?')) return;
    setCancelling(id);
    try {
      const { data } = await api.put(`/orders/${id}/cancel`);
      setOrders((list) => list.map((o) => (o._id === id ? data : o)));
      toast.success('Order cancelled');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setCancelling('');
    }
  };

  return (
    <div className="container section">
      <h1 className="page-title">Your orders</h1>
      {placedId && <p className="notice notice-ok">Your order has been placed. Order #{shortId(placedId)} is shown below.</p>}

      {loading ? (
        <Loader label="Loading your orders..." />
      ) : error ? (
        <StateMessage title="We couldn't load your orders" tone="error">{error}</StateMessage>
      ) : orders.length === 0 ? (
        <StateMessage title="No orders yet" action={<Link className="btn btn-primary" to="/books">Start shopping</Link>}>
          When you place an order, it will appear here.
        </StateMessage>
      ) : (
        <ul className="order-list">
          {orders.map((o) => {
            const open = openId === o._id;
            const canCancel = ['Pending', 'Confirmed'].includes(o.status);
            return (
              <li key={o._id} className="card order">
                <div className="order-head">
                  <div>
                    <strong>Order #{shortId(o._id)}</strong>
                    <p className="muted small">Placed {formatDate(o.createdAt)}</p>
                  </div>
                  <StatusBadge status={o.status} />
                  <strong>{formatPrice(o.totalAmount)}</strong>
                  <button className="btn btn-ghost btn-sm" aria-expanded={open} onClick={() => setOpenId(open ? '' : o._id)}>
                    {open ? 'Hide details' : 'View details'}
                  </button>
                </div>

                {open && (
                  <div className="order-body">
                    <table className="table">
                      <thead><tr><th>Book</th><th>Qty</th><th>Price</th><th>Subtotal</th></tr></thead>
                      <tbody>
                        {o.items.map((i) => (
                          <tr key={i._id}>
                            <td><Link to={`/books/${i.book}`}>{i.title}</Link></td>
                            <td>{i.quantity}</td>
                            <td>{formatPrice(i.price)}</td>
                            <td>{formatPrice(i.price * i.quantity)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="order-cols">
                      <div>
                        <h4>Shipping to</h4>
                        <p>
                          {o.shippingAddress.fullName}<br />
                          {o.shippingAddress.address}<br />
                          {o.shippingAddress.city}, {o.shippingAddress.postalCode}<br />
                          {o.shippingAddress.country}<br />
                          {o.shippingAddress.phone}
                        </p>
                      </div>
                      <div>
                        <h4>Payment</h4>
                        <p>{o.paymentMethod === 'COD' ? 'Cash on delivery' : 'Online payment'}</p>
                      </div>
                    </div>
                    {canCancel ? (
                      <button className="btn btn-danger" disabled={cancelling === o._id} onClick={() => cancel(o._id)}>
                        {cancelling === o._id ? 'Cancelling...' : 'Cancel order'}
                      </button>
                    ) : (
                      <p className="muted small">
                        {o.status === 'Cancelled' ? 'This order was cancelled.' : 'Orders can only be cancelled before they ship.'}
                      </p>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
