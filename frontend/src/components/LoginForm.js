import React from 'react';
import '../styles/forms.css';

export default function LoginForm(props) 
{
  const {
    email, setEmail,
    password, setPassword,
    showPassword, setShowPassword,
    onSubmit, setFaceState, setMessage, invalidFields
  } = props;

  return (
    <form className="form" onSubmit={onSubmit}>
      <label className="label">Email</label>
      <input
        className={`input ${invalidFields && invalidFields.includes('email') ? 'invalid' : ''}`}
        type="email"
        value={email}
        placeholder="email@example.com"
        onChange={(e) => setEmail(e.target.value)}
        aria-invalid={invalidFields && invalidFields.includes('email')}
      />

      <label className="label">Hasło</label>
      <div className="password-pair">
        <input
          className={`input half ${invalidFields && invalidFields.includes('password') ? 'invalid' : ''}`}
          type={showPassword ? 'text' : 'password'}
          value={password}
          placeholder="Twoje hasło"
          onChange={(e) => setPassword(e.target.value)}
          onFocus={() => { 
            if (!showPassword) 
              setFaceState('watching'); 
            }}
          aria-invalid={invalidFields && invalidFields.includes('password')}
        />

        <div className="input half placeholder" />

        <button
          type="button"
          className={`eye-btn ${showPassword ? 'on' : ''}`}
          onClick={() => setShowPassword(!showPassword)}
          aria-label={showPassword ? 'Ukryj hasło' : 'Pokaż hasło'}
        >
          {showPassword ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-5 0-9.27-3.11-11-7 1.1-2.46 3-4.45 5.19-5.66" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M1 1l22 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.2"/></svg>
          )}
        </button>
      </div>

      <div className="forgot">
        <a href="#" onClick={(e)=>{e.preventDefault(); setMessage('Resetowanie hasła nie jest zaimplementowane (demo).')}}>
          Zapomniałeś hasła?
        </a>
      </div>

      <div className="actions">
        <button className="submit">Zaloguj się</button>
      </div>
    </form>
  );
}
