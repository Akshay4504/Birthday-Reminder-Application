import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getBirthdays, createBirthday, updateBirthday, deleteBirthday } from '../api/birthdays';
import { generateMessage } from '../api/ai';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [birthdays, setBirthdays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [notifyState, setNotifyState] = useState('unsupported');

  const [formData, setFormData] = useState({
    name: '',
    birthDate: '',
    relationship: 'friend',
    notes: ''
  });

  const [activeMessagePanel, setActiveMessagePanel] = useState(null);
  const [aiTone, setAiTone] = useState('heartfelt');
  const [aiText, setAiText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);

  useEffect(() => {
    if ('Notification' in window) {
      setNotifyState(Notification.permission);
    }
    fetchBirthdays();
    const interval = setInterval(fetchBirthdays, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotifyState(permission);
      if (permission === 'granted') {
        processNotifications(birthdays);
      }
    }
  };

  const fetchBirthdays = async () => {
    try {
      const data = await getBirthdays();
      setBirthdays(data);
      processNotifications(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const processNotifications = (list) => {
    if (Notification.permission !== 'granted') return;
    const due = list.filter(b => [0, 1, 7].includes(b.daysUntil));
    const todayStr = new Date().toISOString().split('T')[0];

    due.forEach(b => {
      const type = b.daysUntil === 0 ? 'today' : (b.daysUntil === 1 ? '1_day' : '7_day');
      const cacheKey = `notif_${b.id}_${type}_${todayStr}`;
      if (!localStorage.getItem(cacheKey)) {
        const title = `Birthday Reminder: ${b.name}`;
        const body = b.daysUntil === 0 
          ? `It's ${b.name}'s birthday today! Turning ${b.turningAge}.`
          : `${b.name} is turning ${b.turningAge} in ${b.daysUntil} days.`;
        new Notification(title, { body });
        localStorage.setItem(cacheKey, 'true');
      }
    });
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateBirthday(editingId, formData);
      } else {
        await createBirthday(formData);
      }
      setFormData({ name: '', birthDate: '', relationship: 'friend', notes: '' });
      setEditingId(null);
      fetchBirthdays();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleEdit = (b) => {
    setEditingId(b.id);
    setFormData({
      name: b.name,
      birthDate: b.birth_date,
      relationship: b.relationship,
      notes: b.notes || ''
    });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this birthday?')) {
      try {
        await deleteBirthday(id);
        fetchBirthdays();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({ name: '', birthDate: '', relationship: 'friend', notes: '' });
  };

  const handleOpenAiPanel = (bId) => {
    if (activeMessagePanel === bId) {
      setActiveMessagePanel(null);
    } else {
      setActiveMessagePanel(bId);
      setAiText('');
      setAiError(null);
      setAiTone('heartfelt');
    }
  };

  const handleAiAction = async (bId, mode) => {
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await generateMessage({
        birthdayId: bId,
        mode,
        tone: aiTone,
        userText: mode === 'edit' ? aiText : undefined
      });
      setAiText(res.message);
    } catch (err) {
      setAiError(err.message);
    } finally {
      setAiLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(aiText);
    alert('Copied to clipboard!');
  };

  const dueReminders = birthdays.filter(b => [0, 1, 7].includes(b.daysUntil));

  if (loading) return <div className="loading-screen">Loading...</div>;

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Birthday Reminder</h1>
        <div className="user-info">
          <span>{user.email}</span>
          <Link to="/settings" className="btn-secondary" style={{ textDecoration: 'none' }}>⚙️ Settings</Link>
          <button onClick={logout} className="btn-secondary">Log Out</button>
        </div>
      </header>

      {dueReminders.length > 0 && (
        <div className="banner reminder-banner">
          <h3>📅 Upcoming Reminders</h3>
          <ul>
            {dueReminders.map(b => (
              <li key={b.id}>
                <strong>{b.name}</strong> is turning {b.turningAge} {b.daysUntil === 0 ? 'today!' : `in ${b.daysUntil} days!`}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="notification-controls">
        <p>Browser notifications: <strong>{notifyState}</strong></p>
        {notifyState !== 'granted' && notifyState !== 'unsupported' && (
          <button onClick={requestNotificationPermission} className="btn-secondary">
            Enable Notifications
          </button>
        )}
        <small>Browser alerts only work while this page is open. Email reminders cover the rest.</small>
      </div>
      
      <main className="dashboard-content">
        <div className="layout-grid">
          <div className="form-section card">
            <h2>{editingId ? 'Edit Birthday' : 'Add Birthday'}</h2>
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label>Name</label>
                <input required name="name" value={formData.name} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Date (up to 6 months ahead)</label>
                <input 
                  type="date" 
                  required 
                  name="birthDate" 
                  value={formData.birthDate} 
                  onChange={handleChange} 
                  max={(() => {
                    const d = new Date();
                    d.setMonth(d.getMonth() + 6);
                    return d.toISOString().split('T')[0];
                  })()} 
                />
              </div>
              <div className="form-group">
                <label>Relationship</label>
                <select name="relationship" value={formData.relationship} onChange={handleChange} className="form-select">
                  <option value="friend">Friend</option>
                  <option value="family">Family</option>
                  <option value="partner">Partner</option>
                  <option value="colleague">Colleague</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>Notes (optional)</label>
                <textarea name="notes" value={formData.notes} onChange={handleChange} maxLength={500} />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-primary">{editingId ? 'Save' : 'Add'}</button>
                {editingId && <button type="button" className="btn-secondary" onClick={handleCancel}>Cancel</button>}
              </div>
            </form>
          </div>

          <div className="list-section">
            {error && <div className="error-alert">{error}</div>}
            
            {birthdays.length === 0 ? (
              <div className="placeholder-card">
                <h2>No birthdays yet!</h2>
                <p>Use the form to add someone.</p>
              </div>
            ) : (
              <div className="birthday-list">
                {birthdays.map(b => (
                  <div key={b.id} className={`birthday-card ${b.daysUntil === 0 ? 'today' : ''}`}>
                    <div className="bcard-header">
                      <h3>{b.name} <span className="badge">{b.relationship}</span></h3>
                      <div className="actions">
                        <button onClick={() => handleEdit(b)} className="btn-icon">✎</button>
                        <button onClick={() => handleDelete(b.id)} className="btn-icon delete">🗑</button>
                      </div>
                    </div>
                    <div className="bcard-body">
                      <p className="bcard-date">
                        {b.daysUntil === 0 ? '🎉 Today! 🎂' : `In ${b.daysUntil} days (${b.nextDate})`}
                      </p>
                      <p className="bcard-age">Turning {b.turningAge}</p>
                      {b.notes && <p className="bcard-notes">{b.notes}</p>}
                      
                      <button className="btn-secondary message-btn" onClick={() => handleOpenAiPanel(b.id)}>
                        💬 Message
                      </button>

                      {activeMessagePanel === b.id && (
                        <div className="ai-panel">
                          <h4>Draft a Message</h4>
                          <div className="tone-selector">
                            <label>Tone:</label>
                            <select value={aiTone} onChange={e => setAiTone(e.target.value)} disabled={aiLoading}>
                              <option value="heartfelt">Heartfelt</option>
                              <option value="funny">Funny</option>
                              <option value="formal">Formal</option>
                              <option value="short">Short</option>
                            </select>
                          </div>
                          <textarea 
                            className="ai-textarea" 
                            value={aiText} 
                            onChange={e => setAiText(e.target.value)} 
                            placeholder="Type a draft to polish, or click 'Draft with AI' to start from scratch."
                            disabled={aiLoading}
                            maxLength={1000}
                          />
                          {aiError && <div className="error-alert">{aiError}</div>}
                          <div className="ai-actions">
                            <button onClick={() => handleAiAction(b.id, 'draft')} disabled={aiLoading} className="btn-primary">
                              {aiLoading ? 'Thinking...' : (aiText ? 'Regenerate' : 'Draft with AI')}
                            </button>
                            <button onClick={() => handleAiAction(b.id, 'edit')} disabled={aiLoading || !aiText.trim()} className="btn-secondary">
                              Polish my text
                            </button>
                            {aiText && (
                              <button onClick={handleCopy} disabled={aiLoading} className="btn-secondary">
                                Copy
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
