import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Loader from '../../components/Loader.jsx';
import StateMessage from '../../components/StateMessage.jsx';
import api, { getErrorMessage } from '../../services/api';
import { formatPrice } from '../../utils/format';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/admin/stats').then((r) => setStats(r.data)).catch((err) => setError(getErrorMessage(err)));
  }, []);

  if (error) return <StateMessage title="We couldn't load the statistics" tone="error">{error}</StateMessage>;
  if (!stats) return <Loader label="Loading statistics..." />;

  const cards = [
    { label: 'Books', value: stats.totalBooks, to: '/admin/books' },
    { label: 'Categories', value: stats.totalCategories, to: '/admin/categories' },
    { label: 'Orders', value: stats.totalOrders, to: '/admin/orders' },
    { label: 'Users', value: stats.totalUsers },
    { label: 'Reviews', value: stats.totalReviews, to: '/admin/reviews' },
    { label: 'Revenue (excl. cancelled)', value: formatPrice(stats.revenue) },
  ];

  return (
    <>
      <div className="stat-grid">
        {cards.map((c) => {
          const inner = (
            <>
              <span className="stat-value">{c.value}</span>
              <span className="muted">{c.label}</span>
            </>
          );
          return c.to ? (
            <Link key={c.label} to={c.to} className="card stat">{inner}</Link>
          ) : (
            <div key={c.label} className="card stat">{inner}</div>
          );
        })}
      </div>

      {(stats.pendingOrders > 0 || stats.lowStock > 0) && (
        <div className="card attention">
          <h3>Needs attention</h3>
          <ul>
            {stats.pendingOrders > 0 && (
              <li><Link to="/admin/orders">{stats.pendingOrders} pending order{stats.pendingOrders === 1 ? '' : 's'}</Link> waiting to be confirmed</li>
            )}
            {stats.lowStock > 0 && (
              <li><Link to="/admin/books">{stats.lowStock} book{stats.lowStock === 1 ? '' : 's'}</Link> with 5 or fewer copies in stock</li>
            )}
          </ul>
        </div>
      )}
    </>
  );
}
