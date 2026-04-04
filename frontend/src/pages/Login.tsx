import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const loc = useLocation() as { state?: { from?: string } };
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      await login(email, password);
      nav(loc.state?.from || '/dashboard', { replace: true });
    } catch {
      setErr('Invalid email or password.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container-page" style={{ maxWidth: 480, paddingTop: '2rem' }}>
      <div className="glass" style={{ padding: '2rem' }}>
        <h1 style={{ marginTop: 0 }}>Login</h1>
        {err && (
          <p style={{ color: '#dc2626', fontWeight: 600 }} role="alert">
            {err}
          </p>
        )}
        <form onSubmit={onSubmit}>
          <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 600 }} htmlFor="email">
            Email
          </label>
          <input
            id="email"
            className="input"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <label style={{ display: 'block', margin: '1rem 0 0.35rem', fontWeight: 600 }} htmlFor="password">
            Password
          </label>
          <input
            id="password"
            className="input"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1.25rem' }} disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <p style={{ marginTop: '1.25rem' }}>
          New here? <Link to="/register">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
