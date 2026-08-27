import React, { useState, useEffect } from 'react';
import ParticipantPortal from './pages/ParticipantPortal';
import AdminDashboard from './pages/AdminDashboard';
import { ToastContainer } from './components/Toast';
import { LogIn, User, Lock, ExternalLink, Cpu } from 'lucide-react';

export default function App() {
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  // Toast notifications state
  const [toasts, setToasts] = useState([]);

  const showToast = (type, message) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, message }]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Check auth state on mount
  useEffect(() => {
    const token = localStorage.getItem('hackathon_admin_token');
    const storedUser = localStorage.getItem('hackathon_admin_user');
    if (token && storedUser) {
      try {
        setIsAdminAuthenticated(true);
        setAdminUser(JSON.parse(storedUser));
        setIsAdminMode(true); // default to admin view if already logged in
      } catch (e) {
        localStorage.removeItem('hackathon_admin_token');
        localStorage.removeItem('hackathon_admin_user');
      }
    }
  }, []);

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setLoginError('Please enter both username and password.');
      return;
    }

    setLoginError('');
    setIsLoggingIn(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      
      if (res.ok) {
        localStorage.setItem('hackathon_admin_token', data.token);
        localStorage.setItem('hackathon_admin_user', JSON.stringify(data.admin));
        setAdminUser(data.admin);
        setIsAdminAuthenticated(true);
        showToast('success', `Welcome back, ${data.admin.name}!`);
        setUsername('');
        setPassword('');
      } else {
        setLoginError(data.message || 'Invalid username or password.');
        showToast('error', data.message || 'Login failed.');
      }
    } catch (err) {
      console.error(err);
      setLoginError('Network connection error.');
      showToast('error', 'Network error logging in.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('hackathon_admin_token');
    localStorage.removeItem('hackathon_admin_user');
    setIsAdminAuthenticated(false);
    setAdminUser(null);
    setIsAdminMode(false);
    showToast('info', 'Logged out successfully.');
  };

  return (
    <div className="app-container">
      {/* Top Navigation for Portal Switching (Only shown if not authenticated or in participant mode) */}
      {(!isAdminAuthenticated || !isAdminMode) && (
        <header style={{
          background: 'white',
          borderBottom: '1px solid #cbd5e1',
          padding: '0.75rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0f172a' }}>
            <Cpu size={20} className="text-blue-600" style={{ color: 'var(--primary)' }} />
            <span style={{ fontWeight: 800, fontSize: '1rem', tracking: '0.02em' }}>AI Agent Expo & AI Hackathon</span>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {isAdminMode ? (
              <button 
                onClick={() => setIsAdminMode(false)}
                className="btn btn-secondary btn-sm"
              >
                Participant Submission Portal
              </button>
            ) : (
              <button 
                onClick={() => setIsAdminMode(true)}
                className="btn btn-primary btn-sm"
              >
                {isAdminAuthenticated ? 'Admin Dashboard' : 'Admin Login'}
              </button>
            )}
          </div>
        </header>
      )}

      {/* Render selected view */}
      <div style={{ flex: 1 }}>
        {isAdminMode ? (
          isAdminAuthenticated ? (
            <AdminDashboard 
              showToast={showToast} 
              onLogout={handleAdminLogout} 
              adminUser={adminUser}
            />
          ) : (
            /* Admin Login Screen */
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 'calc(100vh - 57px)',
              padding: '2rem 1rem',
              backgroundColor: 'var(--bg-secondary)'
            }}>
              <div className="card" style={{ maxWidth: '400px', width: '100%', padding: '2.5rem 2rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                  <div style={{
                    background: 'var(--primary-light)',
                    color: 'var(--primary)',
                    width: '48px',
                    height: '48px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1rem'
                  }}>
                    <Lock size={22} />
                  </div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>Admin Dashboard</h2>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                    Sign in to review and score hackathon submissions
                  </p>
                </div>

                {loginError && (
                  <div className="alert alert-error" style={{ padding: '0.75rem', fontSize: '0.75rem', marginBottom: '1.25rem' }}>
                    {loginError}
                  </div>
                )}

                <form onSubmit={handleAdminLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Username</label>
                    <div style={{ position: 'relative' }}>
                      <User size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. admin"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        style={{ paddingLeft: '2.25rem' }}
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Password</label>
                    <div style={{ position: 'relative' }}>
                      <Lock size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                      <input
                        type="password"
                        className="form-control"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={{ paddingLeft: '2.25rem' }}
                      />
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    style={{ width: '100%', marginTop: '0.5rem' }}
                    disabled={isLoggingIn}
                  >
                    <LogIn size={16} /> {isLoggingIn ? 'Signing in...' : 'Sign In'}
                  </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '1.5rem', borderTop: '1px solid #cbd5e1', paddingTop: '1.25rem' }}>
                  <button 
                    onClick={() => setIsAdminMode(false)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--primary)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    ← Back to Participant Portal
                  </button>
                  <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '0.75rem' }}>
                    Demo Credentials: <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>admin</span> / <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>admin123</span>
                  </div>
                </div>
              </div>
            </div>
          )
        ) : (
          <ParticipantPortal showToast={showToast} />
        )}
      </div>

      {/* Global Toast Notifications Container */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}
