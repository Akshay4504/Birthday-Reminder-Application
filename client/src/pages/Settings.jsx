import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Settings() {
  const { user, logout, updateSettings, deleteAccount } = useAuth();
  
  const [timezone, setTimezone] = useState(user.timezone);
  const [emailReminders, setEmailReminders] = useState(user.emailRemindersEnabled);
  const [password, setPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const timezones = useMemo(() => {
    try {
      return Intl.supportedValuesOf('timeZone');
    } catch (e) {
      return [user.timezone];
    }
  }, [user.timezone]);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      await updateSettings(timezone, emailReminders);
      setMessage('Settings updated successfully!');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    if (!window.confirm('WARNING: This will permanently delete your account and all birthdays. Are you completely sure?')) {
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      await deleteAccount(password);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <h1>Settings</h1>
          <Link to="/dashboard" className="btn-secondary" style={{ textDecoration: 'none' }}>← Back to Dashboard</Link>
        </div>
        <div className="user-info">
          <span>{user.email}</span>
          <button onClick={logout} className="btn-secondary">Log Out</button>
        </div>
      </header>

      <main className="dashboard-content layout-grid">
        <div className="card">
          <h2>Preferences</h2>
          {message && <div style={{ color: '#4ade80', marginBottom: '1rem' }}>{message}</div>}
          {error && <div className="error-alert">{error}</div>}
          
          <form onSubmit={handleSaveSettings} className="auth-form">
            <div className="form-group">
              <label>Timezone</label>
              <select 
                value={timezone} 
                onChange={(e) => setTimezone(e.target.value)} 
                className="form-select"
                disabled={loading}
              >
                {timezones.map(tz => <option key={tz} value={tz}>{tz}</option>)}
              </select>
            </div>
            
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input 
                type="checkbox" 
                id="emailReminders"
                checked={emailReminders} 
                onChange={(e) => setEmailReminders(e.target.checked)} 
                style={{ width: 'auto' }}
                disabled={loading}
              />
              <label htmlFor="emailReminders" style={{ margin: 0 }}>Enable Email Reminders</label>
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              Save Preferences
            </button>
          </form>
        </div>

        <div className="card" style={{ borderColor: 'var(--error-color)' }}>
          <h2 style={{ color: 'var(--error-color)' }}>Danger Zone</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Permanently delete your account and all associated birthday data.
          </p>
          
          <form onSubmit={handleDeleteAccount} className="auth-form">
            <div className="form-group">
              <label>Confirm Password to Delete</label>
              <input 
                type="password" 
                required 
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Your password"
                disabled={loading}
              />
            </div>
            
            <button type="submit" className="btn-primary" style={{ backgroundColor: 'var(--error-bg)', color: 'var(--error-color)' }} disabled={loading}>
              Delete Account
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
