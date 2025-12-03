import React, { useState } from 'react';

export default function ChangePassword() {
  const [curPwd, setCurPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [newPwd2, setNewPwd2] = useState('');
  const [changeMsg, setChangeMsg] = useState('');
  const [changeError, setChangeError] = useState(false);
  const [changeInvalid, setChangeInvalid] = useState([]);

  const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setChangeMsg(''); setChangeError(false); setChangeInvalid([]);

    if (!curPwd) {
      setChangeMsg('Wpisz aktualne hasło');
      setChangeError(true);
      setChangeInvalid(['currentPassword']);
      return;
    }
    if (newPwd !== newPwd2) {
      setChangeMsg('Nowe hasła nie są identyczne');
      setChangeError(true);
      setChangeInvalid(['newPassword','confirmNewPassword']);
      return;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) {
      setChangeMsg('Brak tokena. Zaloguj się ponownie.');
      setChangeError(true);
      return;
    }

    try {
      const res = await fetch(`${API.replace(/\/$/, '')}/api/v1/change-password/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          current_password: curPwd,
          new_password: newPwd,
          new_password2: newPwd2
        })
      });

      const contentType = res.headers.get('content-type') || '';
      const data = contentType.includes('application/json') ? await res.json() : {};

      if (res.ok) {
        setChangeMsg(data.detail || 'Hasło zmienione pomyślnie.');
        setChangeError(false);
        setCurPwd(''); setNewPwd(''); setNewPwd2('');
        setChangeInvalid([]);
      } else {
        const inv = [];
        if (data.current_password) inv.push('currentPassword');
        if (data.new_password) inv.push('newPassword');
        if (data.non_field_errors) {
          setChangeMsg(Array.isArray(data.non_field_errors) ? data.non_field_errors[0] : data.non_field_errors);
        } else {
          setChangeMsg(
            data.current_password?.[0] ||
            data.new_password?.[0] ||
            data.detail ||
            'Błąd zmiany hasła'
          );
        }
        setChangeError(true);
        setChangeInvalid(inv);
      }
    } catch (err) {
      setChangeMsg('Błąd sieci');
      setChangeError(true);
    }
  };

  return (
    <div className="main-content center-content">
      <h2>Zmiana hasła</h2>
      <p style={{color: '#9ca3af', marginBottom: 30}}>
        Zadbaj o bezpieczeństwo swojego konta, regularnie zmieniając hasło.
      </p>

      <div style={{
        padding: 30,
        background: 'rgba(255,255,255,0.03)',
        borderRadius: 16,
        border: '1px solid rgba(255,255,255,0.05)',
        maxWidth: 480,
        width: '100%',
        margin: '0 auto',
        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)'
      }}>
        <form
          className="form"
          onSubmit={handleChangePassword}
          style={{display: 'flex', flexDirection: 'column', gap: 16}}
          autoComplete="off"
        >
          <div style={{textAlign: 'left'}}>
            <label className="label" style={{marginBottom: 6, display: 'block', color: '#cbd5e1', fontSize: 13}}>Aktualne hasło</label>
            <input
              className={`input ${changeInvalid.includes('currentPassword') ? 'invalid' : ''}`}
              type="password"
              value={curPwd}
              onChange={(e) => setCurPwd(e.target.value)}
              placeholder="••••••••"
              style={{background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)'}}
              autoComplete="off"
            />
          </div>

          <div style={{textAlign: 'left'}}>
            <label className="label" style={{marginBottom: 6, display: 'block', color: '#cbd5e1', fontSize: 13}}>Nowe hasło</label>
            <input
              className={`input ${changeInvalid.includes('newPassword') ? 'invalid' : ''}`}
              type="password"
              value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)}
              placeholder="••••••••"
              style={{background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)'}}
              autoComplete="off"
            />
          </div>

          <div style={{textAlign: 'left'}}>
            <label className="label" style={{marginBottom: 6, display: 'block', color: '#cbd5e1', fontSize: 13}}>Powtórz nowe hasło</label>
            <input
              className={`input ${changeInvalid.includes('confirmNewPassword') ? 'invalid' : ''}`}
              type="password"
              value={newPwd2}
              onChange={(e) => setNewPwd2(e.target.value)}
              placeholder="••••••••"
              style={{background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)'}}
              autoComplete="off"
            />
          </div>

          {changeMsg && (
            <div className={`hint ${changeError ? 'error' : ''}`} style={{marginTop: 5, fontSize: 14, fontWeight: 500}}>
              {changeMsg}
            </div>
          )}

          <div className="actions" style={{marginTop: 10}}>
            <button className="submit" style={{width: '100%', padding: 12, fontSize: 16, fontWeight: 600}} type="submit">Zmień hasło</button>
          </div>
        </form>
      </div>
    </div>
  );
}