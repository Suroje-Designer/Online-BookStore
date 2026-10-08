import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Loader from './Loader.jsx';
import StateMessage from './StateMessage.jsx';

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) return <Loader label="Checking your session..." />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  if (adminOnly && !isAdmin) {
    return (
      <div className="container section">
        <StateMessage title="Admins only" tone="error">
          Your account does not have access to this area.
        </StateMessage>
      </div>
    );
  }
  return children;
}
