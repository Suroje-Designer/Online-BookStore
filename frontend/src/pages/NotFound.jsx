import { Link } from 'react-router-dom';
import StateMessage from '../components/StateMessage.jsx';

export default function NotFound() {
  return (
    <div className="container section">
      <StateMessage title="Page not found" action={<Link className="btn btn-primary" to="/">Go home</Link>}>
        The page you are looking for does not exist or has moved.
      </StateMessage>
    </div>
  );
}
