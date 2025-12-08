import React, { useState, useEffect } from 'react';
import { authApi } from '../api/authApi';
import '../styles/TwoFaSettings.css';

const TwoFaSettings = () => {
  const [is2FaEnabled, setIs2FaEnabled] = useState(false);
  const [qrCode, setQrCode] = useState(null);
  const [backupCodes, setBackupCodes] = useState([]);
  const [setupMsg, setSetupMsg] = useState('');
  
  const [confirmCode, setConfirmCode] = useState('');
  const [isConfiguring, setIsConfiguring] = useState(false);

  const fetchStatus = async () => {
    try 
    {
        const data = await authApi.get2FaStatus();
        if (data) 
        {
            setQrCode(data.qr_code);
            setBackupCodes(data.backup_codes);
            setIs2FaEnabled(data.is_enabled);
        }
    } 
    catch (e)
    {
        console.error(e);
        setSetupMsg('Błąd połączenia z serwerem');
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const startConfiguration = () => {
    fetchStatus();
    setIsConfiguring(true);
  };

  const handleEnable = async () => {
    try 
    {
        const data = await authApi.confirm2Fa(confirmCode, true);
        if (data.ok) 
        {
            setIs2FaEnabled(true);
            setSetupMsg('2FA włączone pomyślnie!');
            setIsConfiguring(false);
            setConfirmCode('');
        } 
        else 
        {
            setSetupMsg(data.error || 'Błąd kodu');
        }
    } 
    catch (e) 
    { 
        setSetupMsg('Błąd sieci'); 
    }
  };

  const handleDisable = async () => {
    try 
    {
        const data = await authApi.confirm2Fa(null, false);
        if (data.ok) 
        {
            setIs2FaEnabled(false);
            setSetupMsg('2FA wyłączone.');
            setQrCode(null);
            setBackupCodes([]);
            fetchStatus(); 
        }   
        else 
        {
            setSetupMsg('Błąd podczas wyłączania');
        }
    } catch (e) { setSetupMsg('Błąd sieci'); }
  };

  const copyBackupCodes = () => {
    const text = backupCodes.join('\n');
    navigator.clipboard.writeText(text);
    alert('Skopiowano kody do schowka!');
  };

  return (
    <div className="main-content center-content">
      <h2>Konfiguracja 2FA</h2>
      <p style={{ color: '#9ca3af', marginBottom: 30 }}>Zarządzaj dwuskładnikowym uwierzytelnianiem.</p>

      <div className="settings-card">
        <div className="settings-header">
          <span className="status-label">Status zabezpieczenia:</span>
          <div className={`status-badge ${is2FaEnabled ? 'active' : 'inactive'}`}>
            {is2FaEnabled ? 'AKTYWNE' : 'NIEAKTYWNE'}
          </div>
        </div>

        {is2FaEnabled ? (
          <div className="active-section">
            <p className="text-info">
              Twoje konto jest chronione. Przy każdym logowaniu wymagane będzie podanie kodu z aplikacji lub kodu zapasowego.
            </p>
            <div className="danger-box">
              <strong className="danger-title">Strefa niebezpieczna</strong>
              <p className="danger-text">Wyłączenie 2FA obniży bezpieczeństwo Twojego konta. Jeśli chcesz skonfigurować 2FA na nowym urządzeniu, wyłącz je i włącz ponownie.</p>
            </div>

            <div className="disable-btn-wrapper">
              <button className="btn-disable" onClick={handleDisable}>
                Wyłącz 2FA
              </button>
            </div>
            {setupMsg && <p className="msg-success">{setupMsg}</p>}
          </div>
        ) : (
          <div>
            {!isConfiguring ? (
              <div className="setup-intro">
                <p style={{ marginBottom: 20, color: '#cbd5e1' }}>
                  Dwuskładnikowe uwierzytelnianie dodaje dodatkową warstwę ochrony do Twojego konta.
                </p>
                <button className="btn-start-setup" onClick={startConfiguration}>
                  Skonfiguruj 2FA
                </button>
              </div>
            ) : (
              <div className="config-wrapper">
                <p style={{ marginBottom: 30, color: '#cbd5e1' }}>Postępuj zgodnie z instrukcjami, aby aktywować zabezpieczenie:</p>

                <div className="config-flex">
                  <div className="config-column">
                    <h4 className="step-header header-blue">1. Zeskanuj kod QR</h4>
                    {qrCode ? (
                      <div className="qr-box">
                        <img src={qrCode} alt="QR Code" className="qr-img" />
                      </div>
                    ) : (
                      <p style={{ textAlign: 'center' }}>Generowanie...</p>
                    )}
                    <p className="text-small-center">Użyj aplikacji Google Authenticator</p>

                    <div className="divider-line"></div>

                    <h4 className="step-header header-blue">2. Wpisz kod z aplikacji</h4>
                    <div className="code-action-row">
                      <input
                        className="input-code"
                        type="text"
                        placeholder="000000"
                        value={confirmCode}
                        onChange={e => setConfirmCode(e.target.value)}
                        maxLength={6}
                      />
                      <button className="btn-activate" onClick={handleEnable}>
                        Włącz
                      </button>
                    </div>
                    {setupMsg && <p className="msg-error">{setupMsg}</p>}
                  </div>
                  <div className="config-column" style={{ display: 'flex', flexDirection: 'column' }}>
                    <h4 className="step-header header-yellow">3. Zapisz kody zapasowe</h4>
                    <p style={{ fontSize: 13, color: '#cbd5e1', marginBottom: 15, textAlign: 'center' }}>
                      W razie utraty telefonu, te kody pozwolą Ci odzyskać dostęp do konta. Skopiuj je teraz!
                    </p>
                    <div className="backup-list">
                      {backupCodes && backupCodes.length > 0 ? (
                        backupCodes.map((code, idx) => (
                          <div key={idx} className="backup-item">
                            {code}
                          </div>
                        ))
                      ) : (
                        <span style={{ gridColumn: 'span 2', textAlign: 'center', color: '#64748b', alignSelf: 'center' }}>Oczekiwanie na sekrety...</span>
                      )}
                    </div>
                    <button className="btn-copy" onClick={copyBackupCodes}>
                      📋 Kopiuj do schowka
                    </button>
                  </div>
                </div>

                <div className="cancel-wrapper">
                  <button className="btn-cancel" onClick={() => setIsConfiguring(false)}>
                    Anuluj konfigurację
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TwoFaSettings;