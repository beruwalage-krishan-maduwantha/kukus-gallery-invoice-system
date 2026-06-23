import { Link } from 'react-router-dom';
import { Button } from 'react-bootstrap';

export default function NotFoundPage() {
  return (
    <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '60vh' }}>
      <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '5rem', color: 'var(--primary)' }}>404</h1>
      <p style={{ fontFamily: 'var(--font-body)', color: 'var(--accent)' }}>Page not found</p>
      <Link to="/">
        <Button className="btn-primary-custom">Back to Dashboard</Button>
      </Link>
    </div>
  );
}
