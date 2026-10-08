import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { formatDate } from '../utils/format';

export default function Profile() {
  const { user, isAdmin, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('You have been logged out');
    navigate('/');
  };

  return (
    <div className="container section narrow">
      <h1 className="page-title">Your profile</h1>
      <div className="card profile">
        <div className="avatar" aria-hidden="true">{user.name.charAt(0).toUpperCase()}</div>
        <dl className="meta meta-stack">
          <div><dt>Name</dt><dd>{user.name}</dd></div>
          <div><dt>Email</dt><dd>{user.email}</dd></div>
          <div><dt>Role</dt><dd><span className={isAdmin ? 'badge badge-ok' : 'badge'}>{user.role}</span></dd></div>
          {user.createdAt && <div><dt>Member since</dt><dd>{formatDate(user.createdAt)}</dd></div>}
        </dl>
        <div className="profile-actions">
          <Link to="/orders" className="btn btn-primary">View my orders</Link>
          {isAdmin && <Link to="/admin" className="btn btn-ghost">Open admin</Link>}
          <button className="btn btn-danger" onClick={handleLogout}>Log out</button>
        </div>
      </div>
    </div>
  );
}
