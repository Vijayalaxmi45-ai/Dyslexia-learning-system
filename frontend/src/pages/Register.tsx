import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (password.length < 8) {
      setErr('Password must be at least 8 characters.');
      return;
    }
    setBusy(true);
    try {
      await register(name, email, password);
      nav('/dashboard', { replace: true });
    } catch (ex: unknown) {
      const msg =
        typeof ex === 'object' && ex && 'response' in ex
          ? (ex as { response?: { data?: { error?: string } } }).response?.data?.error
          : null;
      setErr(msg || 'Registration failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container-page" style={{ maxWidth: 480, paddingTop: '2rem' }}>
      <div className="glass" style={{ padding: '2rem' }}>
        <h1 style={{ marginTop: 0 }}>Register</h1>
        {err && (
          <p style={{ color: '#dc2626', fontWeight: 600 }} role="alert">
            {err}
          </p>
        )}
        <form onSubmit={onSubmit}>
          <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 600 }} htmlFor="name">
            Name
          </label>
          <input
            id="name"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <label style={{ display: 'block', margin: '1rem 0 0.35rem', fontWeight: 600 }} htmlFor="email">
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
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1.25rem' }} disabled={busy}>
            {busy ? 'Creating…' : 'Create account'}
          </button>
        </form>
        <p style={{ marginTop: '1.25rem' }}>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}
