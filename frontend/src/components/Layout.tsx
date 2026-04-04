import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

const linkStyle = ({ isActive }: { isActive: boolean }) => ({
  fontWeight: 600,
  opacity: isActive ? 1 : 0.75,
});

export function Layout() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();

  return (
    <>
      <header className="nav">
        <Link to="/" className="brand">
          🧠 Dyslexia Hub
        </Link>
        <nav className="nav-links">
          <NavLink to="/" end style={linkStyle}>
            Home
          </NavLink>
          <NavLink to="/learning" style={linkStyle}>
            Learning
          </NavLink>
          <NavLink to="/quiz" style={linkStyle}>
            Quiz
          </NavLink>
          <NavLink to="/games" style={linkStyle}>
            Games
          </NavLink>
          <NavLink to="/assessment" style={linkStyle}>
            Screening
          </NavLink>
          <NavLink to="/tools" style={linkStyle}>
            Tools
          </NavLink>
          {user?.role === 'admin' && (
            <NavLink to="/admin" style={linkStyle}>
              Admin
            </NavLink>
          )}
          <button type="button" className="btn-ghost" onClick={toggle} aria-label="Toggle theme">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          {user ? (
            <>
              <NavLink to="/dashboard" style={linkStyle}>
                {user.name}
              </NavLink>
              <button type="button" className="btn-ghost" onClick={logout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" style={linkStyle}>
                Login
              </NavLink>
              <Link to="/register" className="btn-primary" style={{ textDecoration: 'none', color: '#fff' }}>
                Register
              </Link>
            </>
          )}
        </nav>
      </header>
      <Outlet />
      <footer style={{ marginTop: '4rem', padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>
        <p style={{ margin: 0 }}>© 2026 Dyslexia Learning System</p>
      </footer>
    </>
  );
}
