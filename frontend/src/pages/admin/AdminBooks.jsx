import { useCallback, useEffect, useState } from 'react';
import Loader from '../../components/Loader.jsx';
import StateMessage from '../../components/StateMessage.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import api, { getErrorMessage } from '../../services/api';
import { formatPrice } from '../../utils/format';

const EMPTY = { title: '', author: '', description: '', price: '', category: '', ISBN: '', stock: '', image: '', featured: false };

export default function AdminBooks() {
  const toast = useToast();
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');

  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [stockDraft, setStockDraft] = useState({});
  const [busyId, setBusyId] = useState('');

  const load = useCallback(async () => {
    try {
      const [b, c] = await Promise.all([api.get('/books', { params: { sort: 'title' } }), api.get('/categories')]);
      setBooks(b.data);
      setCategories(c.data);
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

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const openNew = () => {
    setEditingId('');
    setForm({ ...EMPTY, category: categories[0]?._id || '' });
    setFormError('');
    setShowForm(true);
  };

  const openEdit = (b) => {
    setEditingId(b._id);
    setForm({
      title: b.title,
      author: b.author,
      description: b.description,
      price: String(b.price),
      category: b.category?._id || '',
      ISBN: b.ISBN,
      stock: String(b.stock),
      image: b.image || '',
      featured: !!b.featured,
    });
    setFormError('');
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId('');
  };

  const save = async (e) => {
    e.preventDefault();
    setFormError('');
    const required = ['title', 'author', 'description', 'price', 'category', 'ISBN', 'stock'];
    if (required.some((k) => String(form[k]).trim() === '')) return setFormError('Fill in all required fields');
    if (Number(form.price) < 0 || isNaN(Number(form.price))) return setFormError('Price must be 0 or more');
    if (!Number.isInteger(Number(form.stock)) || Number(form.stock) < 0) return setFormError('Stock must be a whole number, 0 or more');

    const payload = { ...form, price: Number(form.price), stock: Number(form.stock) };
    setSaving(true);
    try {
      if (editingId) await api.put(`/books/${editingId}`, payload);
      else await api.post('/books', payload);
      toast.success(editingId ? 'Book updated' : 'Book added');
      closeForm();
      await load();
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (b) => {
    if (!window.confirm(`Delete "${b.title}"? Its reviews will be deleted too.`)) return;
    setBusyId(b._id);
    try {
      await api.delete(`/books/${b._id}`);
      toast.success('Book deleted');
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusyId('');
    }
  };

  const saveStock = async (b) => {
    const value = Number(stockDraft[b._id]);
    if (!Number.isInteger(value) || value < 0) return toast.error('Stock must be a whole number, 0 or more');
    setBusyId(b._id);
    try {
      await api.put(`/books/${b._id}`, { stock: value });
      toast.success(`Stock for "${b.title}" set to ${value}`);
      setStockDraft((d) => {
        const { [b._id]: _omit, ...rest } = d;
        return rest;
      });
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusyId('');
    }
  };

  const visible = books.filter((b) => `${b.title} ${b.author} ${b.ISBN}`.toLowerCase().includes(filter.toLowerCase()));

  if (loading) return <Loader label="Loading books..." />;
  if (error) return <StateMessage title="We couldn't load books" tone="error">{error}</StateMessage>;

  return (
    <>
      <div className="toolbar">
        <input type="search" placeholder="Filter by title, author or ISBN" value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter books" />
        <button className="btn btn-primary" onClick={openNew} disabled={categories.length === 0} title={categories.length === 0 ? 'Add a category first' : ''}>
          Add book
        </button>
      </div>
      {categories.length === 0 && <p className="notice">Create a category before adding books.</p>}

      {showForm && (
        <form className="card form-section" onSubmit={save} noValidate>
          <h2>{editingId ? 'Edit book' : 'Add book'}</h2>
          <div className="form-grid">
            <div><label htmlFor="b-title">Title *</label><input id="b-title" value={form.title} onChange={set('title')} /></div>
            <div><label htmlFor="b-author">Author *</label><input id="b-author" value={form.author} onChange={set('author')} /></div>
            <div>
              <label htmlFor="b-cat">Category *</label>
              <select id="b-cat" value={form.category} onChange={set('category')}>
                <option value="">Select a category</option>
                {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <div><label htmlFor="b-isbn">ISBN *</label><input id="b-isbn" value={form.ISBN} onChange={set('ISBN')} /></div>
            <div><label htmlFor="b-price">Price (USD) *</label><input id="b-price" type="number" min="0" step="0.01" value={form.price} onChange={set('price')} /></div>
            <div><label htmlFor="b-stock">Stock *</label><input id="b-stock" type="number" min="0" step="1" value={form.stock} onChange={set('stock')} /></div>
            <div className="full"><label htmlFor="b-image">Cover image URL</label><input id="b-image" placeholder="https://..." value={form.image} onChange={set('image')} /></div>
            <div className="full"><label htmlFor="b-desc">Description *</label><textarea id="b-desc" rows="4" value={form.description} onChange={set('description')} /></div>
            <div className="full">
              <label className="check"><input type="checkbox" checked={form.featured} onChange={set('featured')} /> Show on the home page as a featured book</label>
            </div>
          </div>
          {formError && <p className="form-error" role="alert">{formError}</p>}
          <div className="row-actions">
            <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? 'Saving...' : editingId ? 'Save changes' : 'Add book'}</button>
            <button className="btn btn-ghost" type="button" onClick={closeForm}>Cancel</button>
          </div>
        </form>
      )}

      {visible.length === 0 ? (
        <StateMessage title={books.length === 0 ? 'No books yet' : 'No books match your filter'}>
          {books.length === 0 ? 'Add your first book with the button above.' : 'Try a different search.'}
        </StateMessage>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Title</th><th>Category</th><th>Price</th><th>Stock</th><th><span className="sr-only">Actions</span></th></tr>
            </thead>
            <tbody>
              {visible.map((b) => {
                const draft = stockDraft[b._id];
                const dirty = draft !== undefined && String(draft) !== String(b.stock);
                return (
                  <tr key={b._id}>
                    <td data-label="Title"><strong>{b.title}</strong><br /><span className="muted small">{b.author} - {b.ISBN}</span></td>
                    <td data-label="Category">{b.category?.name || '-'}</td>
                    <td data-label="Price">{formatPrice(b.price)}</td>
                    <td data-label="Stock">
                      <div className="stock-edit">
                        <input
                          type="number" min="0" step="1" aria-label={`Stock for ${b.title}`}
                          value={draft !== undefined ? draft : b.stock}
                          onChange={(e) => setStockDraft((d) => ({ ...d, [b._id]: e.target.value }))}
                        />
                        <button className="btn btn-ghost btn-sm" disabled={!dirty || busyId === b._id} onClick={() => saveStock(b)}>Update</button>
                      </div>
                    </td>
                    <td data-label="Actions" className="actions">
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(b)}>Edit</button>
                      <button className="btn btn-danger btn-sm" disabled={busyId === b._id} onClick={() => remove(b)}>Delete</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
