import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { getErrorMessage } from '../services/api';

export default function Register() {
  const { user, register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';

  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={from} replace />;

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim() || !form.email.trim() || !form.password) return setError('Fill in all fields');
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) return setError('Enter a valid email address');
    if (form.password.length < 6) return setError('Password must be at least 6 characters');
    if (form.password !== form.confirm) return setError('Passwords do not match');

    setBusy(true);
    try {
      const profile = await register(form.name.trim(), form.email.trim(), form.password);
      toast.success(`Account created. Welcome, ${profile.name}`);
      navigate(from, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
      setBusy(false);
    }
  };

  return (
    <div className="container auth-wrap">
      <form className="card auth-card" onSubmit={submit} noValidate>
        <h1>Create your account</h1>
        <p className="muted">Save a cart, track orders and review the books you read.</p>

        <label htmlFor="name">Name</label>
        <input id="name" autoComplete="name" value={form.name} onChange={set('name')} />

        <label htmlFor="email">Email</label>
        <input id="email" type="email" autoComplete="email" value={form.email} onChange={set('email')} />

        <label htmlFor="password">Password</label>
        <input id="password" type="password" autoComplete="new-password" value={form.password} onChange={set('password')} />

        <label htmlFor="confirm">Confirm password</label>
        <input id="confirm" type="password" autoComplete="new-password" value={form.confirm} onChange={set('confirm')} />

        {error && <p className="form-error" role="alert">{error}</p>}

        <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
          {busy ? 'Creating account...' : 'Create account'}
        </button>
        <p className="auth-alt">
          Already registered? <Link to="/login" state={{ from }}>Log in</Link>
        </p>
      </form>
    </div>
  );
}
