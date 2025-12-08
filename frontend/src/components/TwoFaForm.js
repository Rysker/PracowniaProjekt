import React, { useState } from 'react';
import EmojiFace from './EmojiFace';
import '../styles/TwoFaForm.css'; 

const TwoFaForm = ({ onSubmit, onCancel, code, setCode, message, isError }) => {
  const [useBackup, setUseBackup] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(e);
  };

  return (
    <div className="twofa-card">
      <h2 className="twofa-title">Weryfikacja 2FA</h2>
      <p className="twofa-subtitle">
        {useBackup
          ? "Wpisz jeden ze swoich kodów zapasowych."
          : "Wpisz 6-cyfrowy kod z aplikacji uwierzytelniającej."}
      </p>

      <div className="emoji-container">
        <EmojiFace state={useBackup ? "concern" : "watching"} size={100} />
      </div>

      <form className="twofa-form" onSubmit={handleSubmit}>
        <div className="input-wrapper">
          {useBackup ? (
            <input
              className="twofa-input twofa-input-backup"
              placeholder="Kod zapasowy"
              value={code}
              onChange={e => setCode(e.target.value)}
              autoFocus
            />
          ) : (
            <input
              className="twofa-input twofa-input-totp"
              placeholder="000000"
              value={code}
              onChange={e => {
                const val = e.target.value.replace(/[^0-9]/g, '');
                if (val.length <= 6) setCode(val);
              }}
              inputMode="numeric"
              maxLength={6}
              autoFocus
            />
          )}
        </div>

        <div className="twofa-actions">
          <button className="btn-submit">Zaloguj się</button>
        </div>

        <div className="twofa-options">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => { setUseBackup(!useBackup); setCode(''); }}
          >
            {useBackup ? "Użyj kodu z aplikacji (TOTP)" : "Użyj kodu zapasowego"}
          </button>

          <button
            type="button"
            className="btn-text"
            onClick={onCancel}
          >
            Anuluj logowanie
          </button>
        </div>
      </form>
      
      <div className={`hint-msg ${isError ? 'error' : ''}`}>
        {message}
      </div>
    </div>
  );
};

export default TwoFaForm;