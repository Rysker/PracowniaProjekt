import React, { useState } from 'react';
import '../styles/ChangePassword.css';
import { authApi } from '../api/authApi';

export default function ChangePassword() {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [status, setStatus] = useState({ type: '', message: '' });
  const [invalidFields, setInvalidFields] = useState([]);

  const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: '', message: '' });
    setInvalidFields([]);

    const { currentPassword, newPassword, confirmPassword } = formData;

    if (!currentPassword) 
    {
      setStatus({ type: 'error', message: 'Wpisz aktualne hasło' });
      setInvalidFields(['currentPassword']);
      return;
    }

    if (newPassword !== confirmPassword) 
    {
      setStatus({ type: 'error', message: 'Nowe hasła nie są identyczne' });
      setInvalidFields(['newPassword', 'confirmPassword']);
      return;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) 
    {
      setStatus({ type: 'error', message: 'Brak tokena. Zaloguj się ponownie.' });
      return;
    }

    // API Call performed when everything is ok
    try 
    {
      const data = await authApi.changePassword({
            current_password: currentPassword,
            new_password: newPassword,
            new_password2: confirmPassword
      });
      
      if (data.ok) 
      {
        setStatus({ type: 'success', message: data.message || 'Hasło zostało zmienione pomyślnie.' });
        setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } 
      else 
      {
        const newInvalidFields = [];
        let errorMsg = data.error || 'Błąd zmiany hasła';

        if (data.current_password || (data.invalid && data.invalid.includes('current_password'))) 
          newInvalidFields.push('currentPassword');
            
        if (data.new_password || (data.invalid && data.invalid.includes('new_password'))) 
          newInvalidFields.push('newPassword');

        if (data.detail) 
          errorMsg = data.detail;

        setStatus({ type: 'error', message: errorMsg });
        setInvalidFields(newInvalidFields);
      }
    } 
    catch (err) 
    {
        console.error(err);
        setStatus({ type: 'error', message: 'Błąd sieci. Spróbuj ponownie później.' });
    }
  };

  return (
    <div className="cp-container">
      <h2 className="cp-title">Zmiana hasła</h2>
      <p className="cp-subtitle">
        Zadbaj o bezpieczeństwo swojego konta, regularnie zmieniając hasło.
      </p>

      <div className="cp-card">
        <form className="cp-form" onSubmit={handleSubmit}>
          
          <div className="cp-field">
            <label htmlFor="currentPassword" class="cp-label">Aktualne hasło</label>
            <input
              id="currentPassword"
              name="currentPassword"
              className={`cp-input ${invalidFields.includes('currentPassword') ? 'invalid' : ''}`}
              type="password"
              value={formData.currentPassword}
              onChange={handleInputChange}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          <div className="cp-field">
            <label htmlFor="newPassword" class="cp-label">Nowe hasło</label>
            <input
              id="newPassword"
              name="newPassword"
              className={`cp-input ${invalidFields.includes('newPassword') ? 'invalid' : ''}`}
              type="password"
              value={formData.newPassword}
              onChange={handleInputChange}
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </div>

          <div className="cp-field">
            <label htmlFor="confirmPassword" class="cp-label">Powtórz nowe hasło</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              className={`cp-input ${invalidFields.includes('confirmPassword') ? 'invalid' : ''}`}
              type="password"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </div>

          {status.message && (
            <div className={`cp-message ${status.type}`}>
              {status.message}
            </div>
          )}

          <button className="cp-submit-btn" type="submit">
            Zmień hasło
          </button>
        </form>
      </div>
    </div>
  );
}