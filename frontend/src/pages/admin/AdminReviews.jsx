import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Loader from '../../components/Loader.jsx';
import StateMessage from '../../components/StateMessage.jsx';
import { Stars } from '../../components/Stars.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import api, { getErrorMessage } from '../../services/api';
import { formatDate } from '../../utils/format';

export default function AdminReviews() {
  const toast = useToast();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');

  const load = useCallback(async () => {
    try {
      setReviews((await api.get('/reviews')).data);
      setError('');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const remove = async (r) => {
    if (!window.confirm('Delete this review?')) return;
    setBusyId(r._id);
    try {
      await api.delete(`/reviews/${r._id}`);
      setReviews((list) => list.filter((x) => x._id !== r._id));
      toast.success('Review deleted');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusyId('');
    }
  };

  if (loading) return <Loader label="Loading reviews..." />;
  if (error) return <StateMessage title="We couldn't load reviews" tone="error">{error}</StateMessage>;
  if (reviews.length === 0) return <StateMessage title="No reviews yet">Reader reviews will show up here for moderation.</StateMessage>;

  return (
    <div className="table-wrap">
      <table className="table">
        <thead><tr><th>Book</th><th>Reviewer</th><th>Rating</th><th>Comment</th><th>Date</th><th><span className="sr-only">Actions</span></th></tr></thead>
        <tbody>
          {reviews.map((r) => (
            <tr key={r._id}>
              <td data-label="Book">{r.book ? <Link to={`/books/${r.book._id}`}>{r.book.title}</Link> : 'Deleted book'}</td>
              <td data-label="Reviewer">{r.user?.name || 'Deleted user'}</td>
              <td data-label="Rating"><Stars value={r.rating} /></td>
              <td data-label="Comment" className="comment-cell">{r.comment}</td>
              <td data-label="Date">{formatDate(r.createdAt)}</td>
              <td data-label="Actions" className="actions">
                <button className="btn btn-danger btn-sm" disabled={busyId === r._id} onClick={() => remove(r)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
