import { useCallback, useEffect, useState } from 'react';
import Loader from '../../components/Loader.jsx';
import StateMessage from '../../components/StateMessage.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import api, { getErrorMessage } from '../../services/api';

export default function AdminCategories() {
  const toast = useToast();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState('');
  const [editName, setEditName] = useState('');
  const [busyId, setBusyId] = useState('');

  const load = useCallback(async () => {
    try {
      setCategories((await api.get('/categories')).data);
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

  const add = async (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.error('Enter a category name');
    setAdding(true);
    try {
      await api.post('/categories', { name });
      toast.success('Category added');
      setName('');
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setAdding(false);
    }
  };

  const saveEdit = async (id) => {
    if (!editName.trim()) return toast.error('Enter a category name');
    setBusyId(id);
    try {
      await api.put(`/categories/${id}`, { name: editName });
      toast.success('Category updated');
      setEditingId('');
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusyId('');
    }
  };

  const remove = async (c) => {
    if (!window.confirm(`Delete the category "${c.name}"?`)) return;
    setBusyId(c._id);
    try {
      await api.delete(`/categories/${c._id}`);
      toast.success('Category deleted');
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusyId('');
    }
  };

  if (loading) return <Loader label="Loading categories..." />;
  if (error) return <StateMessage title="We couldn't load categories" tone="error">{error}</StateMessage>;

  return (
    <>
      <form className="toolbar" onSubmit={add}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="New category name" aria-label="New category name" maxLength={60} />
        <button className="btn btn-primary" type="submit" disabled={adding}>{adding ? 'Adding...' : 'Add category'}</button>
      </form>

      {categories.length === 0 ? (
        <StateMessage title="No categories yet">Add one above to start organising books.</StateMessage>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Name</th><th>Books</th><th><span className="sr-only">Actions</span></th></tr></thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c._id}>
                  <td data-label="Name">
                    {editingId === c._id ? (
                      <input value={editName} onChange={(e) => setEditName(e.target.value)} aria-label="Category name" maxLength={60} autoFocus />
                    ) : (
                      <strong>{c.name}</strong>
                    )}
                  </td>
                  <td data-label="Books">{c.bookCount}</td>
                  <td data-label="Actions" className="actions">
                    {editingId === c._id ? (
                      <>
                        <button className="btn btn-primary btn-sm" disabled={busyId === c._id} onClick={() => saveEdit(c._id)}>Save</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => setEditingId('')}>Cancel</button>
                      </>
                    ) : (
                      <>
                        <button className="btn btn-ghost btn-sm" onClick={() => { setEditingId(c._id); setEditName(c.name); }}>Edit</button>
                        <button className="btn btn-danger btn-sm" disabled={busyId === c._id} onClick={() => remove(c)}>Delete</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
