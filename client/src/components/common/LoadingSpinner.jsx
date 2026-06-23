import { Spinner } from 'react-bootstrap';

export default function LoadingSpinner({ fullPage }) {
  if (fullPage) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <Spinner animation="border" style={{ color: 'var(--primary)' }} />
      </div>
    );
  }
  return (
    <div className="d-flex justify-content-center py-5">
      <Spinner animation="border" style={{ color: 'var(--primary)' }} />
    </div>
  );
}
