import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { BRAND } from '../brand';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  if (isAuthenticated) {
    const dest = user?.role === 'staff' ? '/quotations' : '/';
    return <Navigate to={dest} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await login(email, password);
      navigate(res.user.role === 'staff' ? '/quotations' : '/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <img src={BRAND.logo} alt={BRAND.name} className="login-logo" />
        <h2 className="login-title">System</h2>
        <p className="login-subtitle">Sign in to continue</p>

        {error && <Alert variant="danger" className="mb-3">{error}</Alert>}

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label className="form-label-custom">Email</Form.Label>
            <Form.Control
              type="email"
              className="form-input"
              placeholder={BRAND.loginPlaceholder}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Form.Group>
          <Form.Group className="mb-4">
            <Form.Label className="form-label-custom">Password</Form.Label>
            <Form.Control
              type="password"
              className="form-input"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Form.Group>
          <Button type="submit" className="btn-primary-custom w-100" disabled={loading}>
            {loading ? <Spinner animation="border" size="sm" /> : 'Sign In'}
          </Button>
        </Form>
      </div>
    </div>
  );
}
