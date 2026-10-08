import { useCallback, useEffect, useState } from 'react';
import Loader from '../../components/Loader.jsx';
import StateMessage from '../../components/StateMessage.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import api, { getErrorMessage } from '../../services/api';
import { formatDate, formatPrice, shortId } from '../../utils/format';

const STATUSES = ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'];

export default function AdminOrders() {
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [openId, setOpenId] = useState('');
  const [drafts, setDrafts] = useState({});
  const [busyId, setBusyId] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/orders/all', { params: { status: statusFilter || undefined } });
      setOrders(data);
      setError('');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const updateStatus = async (order) => {
    const status = drafts[order._id];
    if (!status || status === order.status) return;
    if (status === 'Cancelled' && !window.confirm('Cancel this order? Stock will be returned to the shelves.')) return;
    setBusyId(order._id);
    try {
      const { data } = await api.put(`/orders/${order._id}/status`, { status });
      setOrders((list) => list.map((o) => (o._id === order._id ? { ...o, status: data.status } : o)));
      setDrafts((d) => {
        const { [order._id]: _omit, ...rest } = d;
        return rest;
      });
      toast.success(`Order #${shortId(order._id)} is now ${data.status}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusyId('');
    }
  };

  return (
    <>
      <div className="toolbar">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter by status">
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <button className="btn btn-ghost" onClick={load} disabled={loading}>Refresh</button>
      </div>

      {loading ? (
        <Loader label="Loading orders..." />
      ) : error ? (
        <StateMessage title="We couldn't load orders" tone="error">{error}</StateMessage>
      ) : orders.length === 0 ? (
        <StateMessage title="No orders found">{statusFilter ? `No ${statusFilter.toLowerCase()} orders right now.` : 'Orders will appear here once customers check out.'}</StateMessage>
      ) : (
        <ul className="order-list">
          {orders.map((o) => {
            const open = openId === o._id;
            const locked = ['Cancelled', 'Delivered'].includes(o.status);
            const draft = drafts[o._id] ?? o.status;
            return (
              <li key={o._id} className="card order">
                <div className="order-head">
                  <div>
                    <strong>#{shortId(o._id)}</strong>
                    <p className="muted small">{o.user?.name || 'Deleted user'} - {formatDate(o.createdAt)}</p>
                  </div>
                  <StatusBadge status={o.status} />
                  <strong>{formatPrice(o.totalAmount)}</strong>
                  <button className="btn btn-ghost btn-sm" aria-expanded={open} onClick={() => setOpenId(open ? '' : o._id)}>
                    {open ? 'Hide' : 'View'}
                  </button>
                </div>

                {open && (
                  <div className="order-body">
                    <table className="table">
                      <thead><tr><th>Book</th><th>Qty</th><th>Price</th></tr></thead>
                      <tbody>
                        {o.items.map((i) => (
                          <tr key={i._id}><td>{i.title}</td><td>{i.quantity}</td><td>{formatPrice(i.price)}</td></tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="order-cols">
                      <div>
                        <h4>Customer</h4>
                        <p>{o.user?.name}<br />{o.user?.email}</p>
                      </div>
                      <div>
                        <h4>Ship to</h4>
                        <p>
                          {o.shippingAddress.fullName}<br />{o.shippingAddress.address}<br />
                          {o.shippingAddress.city}, {o.shippingAddress.postalCode}<br />
                          {o.shippingAddress.country}<br />{o.shippingAddress.phone}
                        </p>
                      </div>
                      <div>
                        <h4>Payment</h4>
                        <p>{o.paymentMethod === 'COD' ? 'Cash on delivery' : 'Online'}</p>
                      </div>
                    </div>

                    {locked ? (
                      <p className="muted small">A {o.status.toLowerCase()} order can no longer be changed.</p>
                    ) : (
                      <div className="row-actions">
                        <label htmlFor={`st-${o._id}`} className="sr-only">Order status</label>
                        <select id={`st-${o._id}`} value={draft} onChange={(e) => setDrafts((d) => ({ ...d, [o._id]: e.target.value }))}>
                          {STATUSES.map((s) => <option key={s}>{s}</option>)}
                        </select>
                        <button className="btn btn-primary" disabled={draft === o.status || busyId === o._id} onClick={() => updateStatus(o)}>
                          {busyId === o._id ? 'Updating...' : 'Update status'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
