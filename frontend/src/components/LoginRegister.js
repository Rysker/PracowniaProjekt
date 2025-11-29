import React, { useState, useEffect, useRef } from 'react';
import EmojiFace from './EmojiFace';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import ChangePasswordContent from './ChangePassword';
import '../styles/App.css';

// --- Helper Functions ---
function validatePassword(password) {
  const minLength = 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSymbol = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);

  if (password.length < minLength) return 'Hasło musi mieć min. 8 znaków';
  if (!hasUpper) return 'Hasło musi zawierać dużą literę';
  if (!hasLower) return 'Hasło musi zawierać małą literę';
  if (!hasDigit) return 'Hasło musi zawierać cyfrę';
  if (!hasSymbol) return 'Hasło musi zawierać znak specjalny';
  return null;
}

// --- Sub-Components ---

const TwoFaForm = ({ onSubmit, onCancel, code, setCode, message, isError }) => {
  const [useBackup, setUseBackup] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(e);
  };

  return (
   <div className="card" style={{flexDirection:'column', padding: '40px'}}>
     <h2 style={{marginTop:0}}>Weryfikacja 2FA</h2>
     <p style={{color:'#9ca3af', fontSize:14, marginBottom:20, textAlign:'center'}}>
       {useBackup
        ? "Wpisz jeden ze swoich kodów zapasowych."
        : "Wpisz 6-cyfrowy kod z aplikacji uwierzytelniającej."}
     </p>

     <div className="emoji-wrap" style={{marginBottom:20}}>
       <EmojiFace state={useBackup ? "concern" : "watching"} size={100} />
     </div>

     <form className="form" onSubmit={handleSubmit} style={{width:'100%', maxWidth:300}}>
       {useBackup ? (
        <input
         className="input"
         placeholder="Kod zapasowy"
         value={code}
         onChange={e => setCode(e.target.value)}
         style={{textAlign:'center', fontSize:18, letterSpacing:1}}
         autoFocus
        />
       ) : (
        <input
         className="input"
         placeholder="000000"
         value={code}
         onChange={e => {
           const val = e.target.value.replace(/[^0-9]/g, '');
           if (val.length <= 6) setCode(val);
         }}
         style={{textAlign:'center', fontSize:24, letterSpacing:4}}
         inputMode="numeric"
         autoFocus
        />
       )}

       <div className="actions" style={{marginTop:20}}>
         <button className="submit">Zaloguj się</button>
       </div>

       <div style={{display:'flex', flexDirection:'column', gap: 12, marginTop: 20}}>
         <button
          type="button"
          onClick={() => { setUseBackup(!useBackup); setCode(''); }}
          style={{background:'transparent', border:'1px solid rgba(255,255,255,0.1)', padding: '10px', borderRadius: 8, color:'#cbd5e1', cursor:'pointer', fontSize: 13, transition: 'background 0.2s'}}
          onMouseOver={e => e.target.style.background = 'rgba(255,255,255,0.05)'}
          onMouseOut={e => e.target.style.background = 'transparent'}
         >
           {useBackup ? "Użyj kodu z aplikacji (TOTP)" : "Nie mam telefonu / Użyj kodu zapasowego"}
         </button>

         <button
          type="button"
          onClick={onCancel}
          style={{background:'transparent', border:0, color:'#60a5fa', cursor:'pointer', fontSize: 13}}
         >
           Anuluj logowanie
         </button>
       </div>
     </form>
     <div className={`hint ${isError?'error':''}`} style={{height: 20, marginTop: 10}}>{message}</div>
   </div>
  );
};

const TwoFaSettings = ({
                         is2FaEnabled,
                         qrCode,
                         backupCodes,
                         onEnable2Fa,
                         onDisable2Fa,
                         fetchStatus,
                         setupMsg
                       }) => {
  const [confirmCode, setConfirmCode] = useState('');
  const [isConfiguring, setIsConfiguring] = useState(false);

  useEffect(() => {
    fetchStatus();
    // eslint-disable-next-line
  }, []);

  const startConfiguration = () => {
    fetchStatus(); // Odświeżamy (generujemy nowy sekret) przy wejściu w konfigurację
    setIsConfiguring(true);
  };

  return (
   <div className="main-content center-content">
     <h2>Konfiguracja 2FA</h2>
     <p style={{color: '#9ca3af', marginBottom: 30}}>Zarządzaj dwuskładnikowym uwierzytelnianiem.</p>

     <div style={{
       padding: 30,
       background: 'rgba(255,255,255,0.03)',
       borderRadius: 16,
       border: '1px solid rgba(255,255,255,0.05)',
       maxWidth: 800,
       margin: '0 auto',
       boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)'
     }}>

       {/* Header Statusu */}
       <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 20, marginBottom: 20}}>
         <span style={{fontSize: 16, color: '#e2e8f0'}}>Status zabezpieczenia:</span>
         <div style={{
           padding: '6px 16px',
           borderRadius: 20,
           background: is2FaEnabled ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
           color: is2FaEnabled ? '#34d399' : '#f87171',
           fontWeight: 700,
           fontSize: 14,
           border: `1px solid ${is2FaEnabled ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
         }}>
           {is2FaEnabled ? 'AKTYWNE' : 'NIEAKTYWNE'}
         </div>
       </div>

       {is2FaEnabled ? (
        // WIDOK: 2FA WŁĄCZONE
        <div style={{animation: 'fadeIn 0.3s', textAlign: 'left'}}>
          <p style={{color: '#cbd5e1', lineHeight: '1.6'}}>
            Twoje konto jest chronione. Przy każdym logowaniu wymagane będzie podanie kodu z aplikacji lub kodu zapasowego.
          </p>
          <div style={{marginTop: 20, padding: 15, background: 'rgba(239, 68, 68, 0.1)', borderRadius: 8, borderLeft: '4px solid #ef4444'}}>
            <strong style={{color: '#fca5a5', display:'block', marginBottom: 5}}>Strefa niebezpieczna</strong>
            <p style={{margin:0, fontSize: 13, color: '#e2e8f0'}}>Wyłączenie 2FA obniży bezpieczeństwo Twojego konta. Jeśli chcesz skonfigurować 2FA na nowym urządzeniu, wyłącz je i włącz ponownie.</p>
          </div>

          <div style={{display:'flex', justifyContent:'flex-end', marginTop: 20}}>
            <button
             className="submit"
             style={{background: '#ef4444', color:'white', maxWidth: 150, fontWeight: 600}}
             onClick={onDisable2Fa}
            >
              Wyłącz 2FA
            </button>
          </div>
          {setupMsg && <p style={{color: '#34d399', marginTop:15, textAlign:'center', fontWeight:600}}>{setupMsg}</p>}
        </div>
       ) : (
        // WIDOK: 2FA WYŁĄCZONE
        <div>
          {!isConfiguring ? (
           // Ekran początkowy (przed konfiguracją)
           <div style={{animation: 'fadeIn 0.3s', padding: '20px 0'}}>
             <p style={{marginBottom: 20, color: '#cbd5e1'}}>
               Dwuskładnikowe uwierzytelnianie dodaje dodatkową warstwę ochrony do Twojego konta.
             </p>
             <button
              className="submit"
              style={{maxWidth: 250, marginTop: 10, padding: '12px 24px', fontSize: 16}}
              onClick={startConfiguration}
             >
               Skonfiguruj 2FA
             </button>
           </div>
          ) : (
           // Ekran konfiguracji (QR + Kody)
           <div style={{animation: 'fadeIn 0.3s'}}>
             <p style={{marginBottom: 30, color: '#cbd5e1'}}>Postępuj zgodnie z instrukcjami, aby aktywować zabezpieczenie:</p>

             <div style={{display:'flex', gap: 30, flexWrap: 'wrap', justifyContent:'center', alignItems: 'stretch'}}>

               {/* Krok 1 & 2: QR i Kod */}
               <div style={{flex: '1 1 300px', maxWidth: 380, textAlign:'left', background:'rgba(0,0,0,0.2)', padding: 20, borderRadius: 12}}>
                 <h4 style={{marginTop:0, color: '#7dd3fc', marginBottom: 15, textAlign: 'center'}}>1. Zeskanuj kod QR</h4>
                 {qrCode ? (
                  <div style={{background:'white', padding: 12, borderRadius: 12, width: 'fit-content', margin: '0 auto 20px'}}>
                    <img src={qrCode} alt="QR Code" style={{display:'block', width: 160, height: 160}} />
                  </div>
                 ) : (
                  <p style={{textAlign:'center'}}>Generowanie...</p>
                 )}
                 <p style={{fontSize: 13, color: '#9ca3af', textAlign:'center'}}>Użyj aplikacji Google Authenticator</p>

                 <div style={{borderTop: '1px solid rgba(255,255,255,0.1)', margin: '20px 0'}}></div>

                 <h4 style={{marginTop:0, color: '#7dd3fc', marginBottom: 15, textAlign: 'center'}}>2. Wpisz kod z aplikacji</h4>
                 <div style={{display:'flex', gap: 10, justifyContent: 'center'}}>
                   <input
                    className="input"
                    type="text"
                    placeholder="000000"
                    value={confirmCode}
                    onChange={e => setConfirmCode(e.target.value)}
                    style={{width: 140, textAlign:'center', letterSpacing: 3, fontSize: 18, fontWeight: 600}}
                    maxLength={6}
                   />
                   <button className="submit" style={{width: 'auto', padding: '0 24px', fontWeight: 600}} onClick={() => onEnable2Fa(confirmCode)}>
                     Włącz
                   </button>
                 </div>
                 {setupMsg && <p style={{color: '#f87171', marginTop:15, fontSize:14, fontWeight:600, textAlign: 'center'}}>{setupMsg}</p>}
               </div>

               {/* Krok 3: Kody zapasowe */}
               <div style={{flex: '1 1 300px', maxWidth: 380, textAlign:'left', background: 'rgba(0,0,0,0.2)', padding: 20, borderRadius: 12, display:'flex', flexDirection:'column'}}>
                 <h4 style={{marginTop:0, color: '#fbbf24', marginBottom: 10, textAlign: 'center'}}>3. Zapisz kody zapasowe</h4>
                 <p style={{fontSize: 13, color: '#cbd5e1', marginBottom: 15, textAlign: 'center'}}>
                   W razie utraty telefonu, te kody pozwolą Ci odzyskać dostęp do konta. Skopiuj je teraz!
                 </p>
                 <div style={{
                   display: 'grid',
                   gridTemplateColumns: '1fr 1fr',
                   gap: 10,
                   fontFamily: 'monospace',
                   background: 'rgba(0,0,0,0.3)',
                   padding: 15,
                   borderRadius: 8,
                   fontSize: 14,
                   flex: 1
                 }}>
                   {backupCodes && backupCodes.length > 0 ? (
                    backupCodes.map((code, idx) => (
                     <div key={idx} style={{
                       color: '#fbbf24',
                       background:'rgba(255,255,255,0.05)',
                       borderRadius:4,
                       padding: '8px 2px',
                       display: 'flex',
                       alignItems: 'center',
                       justifyContent: 'center'
                     }}>
                       {code}
                     </div>
                    ))
                   ) : (
                    <span style={{gridColumn: 'span 2', textAlign:'center', color:'#64748b', alignSelf:'center'}}>Oczekiwanie na sekrety...</span>
                   )}
                 </div>
                 <button
                  style={{
                    background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.1)',
                    color:'#fff', padding: '10px', borderRadius: 8, marginTop: 15, cursor:'pointer', width: '100%', fontWeight: 600,
                    transition: 'background 0.2s'
                  }}
                  onClick={() => {
                    const text = backupCodes.join('\n');
                    navigator.clipboard.writeText(text);
                    alert('Skopiowano kody do schowka!');
                  }}
                  onMouseOver={e => e.target.style.background = 'rgba(255,255,255,0.2)'}
                  onMouseOut={e => e.target.style.background = 'rgba(255,255,255,0.1)'}
                 >
                   📋 Kopiuj do schowka
                 </button>
               </div>
             </div>

             <div style={{marginTop: 30, textAlign: 'center'}}>
               <button
                style={{background:'transparent', border:0, color:'#60a5fa', cursor:'pointer', fontSize: 14}}
                onClick={() => setIsConfiguring(false)}
               >
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

const HomeContent = () => (
 <div className="main-content center-content">
   <h2>Strona domowa</h2>
   <p style={{marginTop: 20, lineHeight: '1.6', color: '#cbd5e1', maxWidth: 600}}>
     Witaj w panelu użytkownika. Po lewej stronie znajduje się menu nawigacyjne.
     <br/><br/>
     Przejdź do zakładki <strong>2FA</strong>, aby skonfigurować dodatkowe zabezpieczenia,
     lub do zakładki <strong>Zmiana hasła</strong>, aby zaktualizować swoje dane logowania.
   </p>
 </div>
);

// --- Main Component ---

export default function LoginRegister() {
  const [mode, setMode] = useState('login');
  const [page, setPage] = useState('auth');
  const [innerPage, setInnerPage] = useState('home');

  // Login Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // 2FA Login State
  const [is2FaLogin, setIs2FaLogin] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [twoFaCode, setTwoFaCode] = useState('');

  // UI State
  const [faceState, setFaceState] = useState('idle');
  const [message, setMessage] = useState('');
  const [invalidFields, setInvalidFields] = useState([]);
  const [isError, setIsError] = useState(false);
  const [faceLocked, setFaceLocked] = useState(false);

  // Change Password State
  const [curPwd, setCurPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [newPwd2, setNewPwd2] = useState('');
  const [changeMsg, setChangeMsg] = useState('');
  const [changeError, setChangeError] = useState(false);
  const [changeInvalid, setChangeInvalid] = useState([]);

  // 2FA Settings State
  const [qrCode, setQrCode] = useState(null);
  const [backupCodes, setBackupCodes] = useState([]);
  const [is2FaEnabled, setIs2FaEnabled] = useState(false);
  const [setupMsg, setSetupMsg] = useState('');

  const revertRef = useRef(null);
  const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

  useEffect(() => {
    if (faceLocked) return;
    if (!email && !password) return setFaceState('idle');
    if (showPassword) return setFaceState('peek');
    if (email && !password) return setFaceState('happy');

    const pwdError = validatePassword(password);
    if (password && pwdError) return setFaceState('concern');
    if (password && !pwdError) return setFaceState('confident');
  }, [email, password, showPassword, faceLocked]);

  const validate = () => {
    const okEmail = /@/.test(email);
    if (!okEmail) return { valid: false, error: 'Nieprawidłowy email' };

    if (mode === 'register') {
      if (password !== confirmPassword) return { valid: false, error: 'Hasła nie są identyczne' };
      const pwdError = validatePassword(password);
      if (pwdError) return { valid: false, error: pwdError };
    } else {
      if (password.length === 0) return { valid: false, error: 'Wpisz hasło' };
    }
    return { valid: true };
  };

  const submit = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsError(false);
    setInvalidFields([]);

    const { valid, error } = validate();
    if (!valid) {
      setMessage(error);
      setFaceState('neutral flip-mouth');
      setFaceLocked(true);
      setIsError(true);
      return;
    }

    const baseUrl = API.replace(/\/$/, '');
    const endpoint = mode === 'login' ? `${baseUrl}/api/v1/login/` : `${baseUrl}/api/v1/register/`;
    const payload = { email, password };
    if (mode === 'register') payload.re_password = confirmPassword;

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.ok) {
        if (mode === 'login') {
          if (data['2fa_required']) {
            setTempToken(data.temp_token);
            setIs2FaLogin(true);
            setMessage('');
            setFaceState('peek');
            return;
          }
          if (data.token) localStorage.setItem('accessToken', data.token);
          if (data.refresh) localStorage.setItem('refreshToken', data.refresh);
          onLoginSuccess();
        } else {
          setFaceState('success');
          setMessage('Konto utworzone! Przekierowanie do logowania...');
          setTimeout(() => {
            setMode('login');
            setEmail(email);
            setPassword('');
            setConfirmPassword('');
            setMessage('Zaloguj się nowym kontem.');
            setFaceState('idle');
          }, 2000);
        }
      } else {
        handleErrorResponse(data);
      }
    } catch (err) {
      handleNetworkError(err);
    }
  };

  const submit2FA = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsError(false);

    if (twoFaCode.length < 6) {
      setMessage('Kod jest za krótki');
      setIsError(true);
      return;
    }

    const baseUrl = API.replace(/\/$/, '');
    try {
      const res = await fetch(`${baseUrl}/api/v1/login/2fa/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ temp_token: tempToken, code: twoFaCode }),
      });
      const data = await res.json();

      if (res.ok) {
        if (data.token) localStorage.setItem('accessToken', data.token);
        if (data.refresh) localStorage.setItem('refreshToken', data.refresh);
        onLoginSuccess();
      } else {
        setMessage(data.error || 'Błędny kod');
        setIsError(true);
        setFaceState('sad');
      }
    } catch (err) {
      handleNetworkError(err);
    }
  };

  const onLoginSuccess = () => {
    setFaceState('success');
    setMessage('Zalogowano pomyślnie!');
    setTimeout(() => setFaceState('idle'), 1200);
    setPage('home');
    setInnerPage('home');
    setIs2FaLogin(false);
    setTwoFaCode('');
  };

  const handleErrorResponse = (data) => {
    console.error('API Error:', data);
    setFaceState('neutral flip-mouth');
    setFaceLocked(true);
    setIsError(true);
    let errorMsg = data.error || data.detail || 'Błąd uwierzytelniania';
    setMessage(errorMsg);
    if (data.invalid) setInvalidFields(data.invalid);
    if (revertRef.current) clearTimeout(revertRef.current);
    revertRef.current = setTimeout(() => {
      setFaceState('concern');
      setFaceLocked(false);
    }, 3000);
  };

  const handleNetworkError = (err) => {
    console.error('Network Error:', err);
    setFaceState('dizzy');
    setMessage('Błąd połączenia z serwerem.');
    setIsError(true);
    setFaceLocked(true);
    if (revertRef.current) clearTimeout(revertRef.current);
    revertRef.current = setTimeout(() => {
      setFaceState('idle');
      setFaceLocked(false);
    }, 4000);
  };

  const handleLogout = () => {
    setPage('auth');
    setEmail('');
    setPassword('');
    setTwoFaCode('');
    setIs2FaLogin(false);
    setQrCode(null);
    setBackupCodes([]);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setMessage('');
    setFaceState('idle');
  };

  // --- 2FA Settings Actions ---

  const fetch2FaStatus = async () => {
    const token = localStorage.getItem('accessToken');
    const baseUrl = API.replace(/\/$/, '');
    try {
      const res = await fetch(`${baseUrl}/api/v1/2fa/setup/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setQrCode(data.qr_code);
        setBackupCodes(data.backup_codes);
        setIs2FaEnabled(data.is_enabled);
      }
    } catch (e) { console.error(e); }
  };

  const handleEnable2FA = async (code) => {
    const token = localStorage.getItem('accessToken');
    const baseUrl = API.replace(/\/$/, '');
    setSetupMsg('');
    try {
      const res = await fetch(`${baseUrl}/api/v1/2fa/confirm/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ code: code, enable: true })
      });
      const data = await res.json();
      if (res.ok) {
        setIs2FaEnabled(true);
        setSetupMsg('2FA włączone pomyślnie!');
      } else {
        setSetupMsg(data.error || 'Błędny kod');
      }
    } catch (e) { setSetupMsg('Błąd sieci'); }
  };

  const handleDisable2FA = async () => {
    const token = localStorage.getItem('accessToken');
    const baseUrl = API.replace(/\/$/, '');
    setSetupMsg('');
    try {
      const res = await fetch(`${baseUrl}/api/v1/2fa/confirm/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ enable: false }) // No code required
      });
      if (res.ok) {

        setIs2FaEnabled(false);
        setSetupMsg('2FA wyłączone.');
        fetch2FaStatus(); // Odśwież, żeby wygenerować nowe sekrety na przyszłość
      } else {
        setSetupMsg('Błąd podczas wyłączania');
      }
    } catch (e) { setSetupMsg('Błąd sieci'); }
  };

  const SidebarComp = () => (
   <aside className="sidebar left-sidebar">
     <div className="sidebar-top">
       <div className="emoji-wrap"><EmojiFace state={faceState} size={100} /></div>
       <div className="user-email centered sidebar-email">{email}</div>
     </div>
     <nav className="sidebar-nav">
       <button className={`nav-btn ${innerPage==='home'?'active':''}`} onClick={()=>setInnerPage('home')}>Start</button>
       <button className={`nav-btn ${innerPage==='settings2fa'?'active':''}`} onClick={()=>setInnerPage('settings2fa')}>2FA</button>
       <button className={`nav-btn ${innerPage==='changePassword'?'active':''}`} onClick={()=>setInnerPage('changePassword')}>Zmiana hasła</button>
     </nav>
     <div className="sidebar-bottom">
       <button className="signout-btn" onClick={handleLogout}>Wyloguj</button>
     </div>
   </aside>
  );

  // RENDER logic
  if (page === 'auth') {
    if (is2FaLogin) {
      return (
       <div className="demo-root" style={{display:'flex', justifyContent:'center', height:'100vh', alignItems:'center'}}>
         <TwoFaForm
          onSubmit={submit2FA}
          onCancel={handleLogout}
          code={twoFaCode}
          setCode={setTwoFaCode}
          message={message}
          isError={isError}
         />
       </div>
      )
    }

    return (
     <div className="demo-root">
       <div className="card">
         <div className="left"><EmojiFace state={faceState} size={160} /></div>
         <div className="right">
           <div className="mode-toggle">
             <button className={mode==='login'?'active':''} onClick={()=>{setMode('login'); setMessage(''); setIsError(false);}}>Login</button>
             <button className={mode==='register'?'active':''} onClick={()=>{setMode('register'); setMessage(''); setIsError(false);}}>Register</button>
           </div>
           {mode === 'login' ? (
            <LoginForm
             email={email} setEmail={setEmail}
             password={password} setPassword={setPassword}
             showPassword={showPassword} setShowPassword={setShowPassword}
             onSubmit={submit} setFaceState={setFaceState} setMessage={setMessage}
             invalidFields={invalidFields}
            />
           ) : (
            <RegisterForm
             email={email} setEmail={setEmail}
             password={password} setPassword={setPassword}
             confirmPassword={confirmPassword} setConfirmPassword={setConfirmPassword}
             showPassword={showPassword} setShowPassword={setShowPassword}
             onSubmit={submit} setFaceState={setFaceState}
             invalidFields={invalidFields}
            />
           )}
           <div className={`hint ${isError?'error':''}`}>{message}</div>
         </div>
       </div>
     </div>
    );
  }

  return (
   <div className="demo-root">
     <div className="authenticated-left-root">
       <SidebarComp />
       <main className="content-area centered-area">
         {innerPage === 'home' && <HomeContent />}

         {innerPage === 'settings2fa' && (
          <TwoFaSettings
           is2FaEnabled={is2FaEnabled}
           qrCode={qrCode}
           backupCodes={backupCodes}
           onEnable2Fa={handleEnable2FA}
           onDisable2Fa={handleDisable2FA}
           fetchStatus={fetch2FaStatus}
           setupMsg={setupMsg}
          />
         )}

         {innerPage === 'changePassword' && (
          <ChangePasswordContent
           handleChangePassword={()=>{}}
           changeInvalid={[]} curPwd={curPwd} setCurPwd={setCurPwd}
           newPwd={newPwd} setNewPwd={setNewPwd}
           newPwd2={newPwd2} setNewPwd2={setNewPwd2}
           changeError={false} changeMsg=""
          />
         )}
       </main>
     </div>
   </div>
  );
}