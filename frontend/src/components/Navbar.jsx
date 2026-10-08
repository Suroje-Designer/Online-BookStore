import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const { itemCount } = useCart();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Close the mobile menu after navigating.
  useEffect(() => {
  setOpen(false);
}, [location.pathname, location.search]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const link = ({ isActive }) => (isActive ? 'nav-link active' : 'nav-link');

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="brand" aria-label="Pageturn home">
          <svg width="26" height="26" viewBox="0 0 64 64" aria-hidden="true">
            <rect width="64" height="64" rx="14" fill="#E9A93B" />
            <path d="M16 14h22a10 10 0 0 1 10 10v26H26a10 10 0 0 1-10-10z" fill="#12332F" />
          </svg>
          Pageturn
        </Link>

        <button
          className="menu-toggle"
          aria-label="Toggle menu"
          aria-expanded={open}
          aria-controls="main-nav"
          onClick={() => setOpen((o) => !o)}
        >
          <span />
          <span />
          <span />
        </button>

        <nav id="main-nav" className={open ? 'nav open' : 'nav'}>
          <NavLink to="/" end className={link}>Home</NavLink>
          <NavLink to="/books" className={link}>Books</NavLink>
          <NavLink to="/categories" className={link}>Categories</NavLink>
          <NavLink to="/cart" className={link}>
            Cart
            {itemCount > 0 && <span className="cart-count" aria-label={`${itemCount} items in cart`}>{itemCount}</span>}
          </NavLink>
          {user && <NavLink to="/orders" className={link}>Orders</NavLink>}
          {user && <NavLink to="/profile" className={link}>Profile</NavLink>}
          {isAdmin && <NavLink to="/admin" className={link}>Admin</NavLink>}

          <span className="nav-spacer" />

          {user ? (
            <button className="btn btn-ghost btn-sm" onClick={handleLogout}>Log out</button>
          ) : (
            <>
              <NavLink to="/login" className={link}>Login</NavLink>
              <Link to="/register" className="btn btn-accent btn-sm">Register</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
