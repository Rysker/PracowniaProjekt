import React, { useState, useEffect, useRef } from 'react';
import EmojiFace from './EmojiFace';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import ChangePasswordContent from './ChangePassword';
import '../styles/App.css';

function validatePassword(password) 
{
  const minLength = 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSymbol = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);

  if (password.length < minLength) return 'Hasło musi mieć min. 8 znaków';
  if (!hasUpper) 
    return 'Hasło musi zawierać dużą literę';
  if (!hasLower) 
    return 'Hasło musi zawierać małą literę';
  if (!hasDigit) 
    return 'Hasło musi zawierać cyfrę';
  if (!hasSymbol) 
    return 'Hasło musi zawierać znak specjalny';
  return null;
}

export default function LoginRegister() 
{
  const [mode, setMode] = useState('login');
  const [page, setPage] = useState('auth');
  const [innerPage, setInnerPage] = useState('home');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [faceState, setFaceState] = useState('idle');
  const [message, setMessage] = useState('');
  const [invalidFields, setInvalidFields] = useState([]);
  const [isError, setIsError] = useState(false);
  const [faceLocked, setFaceLocked] = useState(false);

  const [curPwd, setCurPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [newPwd2, setNewPwd2] = useState('');
  const [changeMsg, setChangeMsg] = useState('');
  const [changeError, setChangeError] = useState(false);
  const [changeInvalid, setChangeInvalid] = useState([]);

  const revertRef = useRef(null);
  const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

  useEffect(() => {
    if (faceLocked) 
      return;
    if (!email && !password) 
      return setFaceState('idle');
    if (showPassword) 
      return setFaceState('peek');
    if (email && !password) 
      return setFaceState('happy');

    const pwdError = validatePassword(password);
    if (password && pwdError) 
      return setFaceState('concern');
    if (password && !pwdError) 
      return setFaceState('confident');
  }, [email, password, showPassword, faceLocked]);

  const validate = () => {
    const okEmail = /@/.test(email);
    if (!okEmail) 
      return { valid: false, error: 'Nieprawidłowy email' };

    if (mode === 'register') 
    {
      if (password !== confirmPassword) 
        return { valid: false, error: 'Hasła nie są identyczne' };
      const pwdError = validatePassword(password);
      if (pwdError) 
        return { valid: false, error: pwdError };
    } 
    else 
    {
      if (password.length === 0) 
        return { valid: false, error: 'Wpisz hasło' };
    }

    return { valid: true };
  };

  const submit = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsError(false);
    setInvalidFields([]);

    if (revertRef.current) 
    {
      clearTimeout(revertRef.current);
      revertRef.current = null;
    }

    const { valid, error } = validate();
    if (!valid) 
    {
      setMessage(error);
      setFaceState('neutral flip-mouth');
      setFaceLocked(true);
      setIsError(true);
      return;
    }

    const baseUrl = API.replace(/\/$/, '');
    const endpoint = mode === 'login' ? `${baseUrl}/api/v1/login/` : `${baseUrl}/api/v1/register/`;
    const payload = { email, password };

    if (mode === 'register') 
      payload.re_password = confirmPassword;

    try 
    {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const contentType = res.headers.get('content-type');
      let data = {};
      if (contentType && contentType.indexOf('application/json') !== -1) data = await res.json();
      else throw new Error('Błąd serwera');

      if (res.ok) 
      {
        if (mode === 'login') 
        {
          if (data.token || data.access) 
            localStorage.setItem('accessToken', data.token || data.access);
          if (data.refresh) 
            localStorage.setItem('refreshToken', data.refresh);

          setFaceState('success');
          setMessage('Zalogowano pomyślnie!');
          setTimeout(() => setFaceState('idle'), 1200);
          setPage('home');
        } 
        else 
        {
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
      } 
      else 
      {
        console.error('API Error:', data);
        setFaceState('neutral flip-mouth');
        setFaceLocked(true);
        setIsError(true);

        let errorMsg = 'Błąd uwierzytelniania';
        const invalids = [];

        if (data.detail) 
          errorMsg = data.detail;
        else if (data.non_field_errors) 
          errorMsg = data.non_field_errors[0];
        else if (data.email) 
        {
          errorMsg = data.email[0];
          invalids.push('email');
        } 
        else if (data.password) 
        {
          errorMsg = data.password[0];
          invalids.push('password');
        }

        setMessage(errorMsg);
        if (invalids.length > 0) 
          setInvalidFields(invalids);

        revertRef.current = setTimeout(() => {
          setFaceState('concern');
          setFaceLocked(false);
        }, 3000);
      }
    } 
    catch (err) 
    {
      console.error('Network Error:', err);
      setFaceState('dizzy');
      setMessage('Błąd połączenia z serwerem. Sprawdź czy Django działa.');
      setIsError(true);
      setFaceLocked(true);

      revertRef.current = setTimeout(() => {
        setFaceState('idle');
        setFaceLocked(false);
      }, 4000);
    }
  };

  const handleLogout = () => {
    setPage('auth');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setMessage('');
    setFaceState('idle');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  };

  const HomeContent = () => (
    <div className="main-content center-content">
      <h2>To jest strona domowa</h2>
    </div>
  );

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setChangeMsg('');
    setChangeError(false);
    setChangeInvalid([]);

    if (!curPwd) 
    {
      setChangeMsg('Wpisz aktualne hasło');
      setChangeError(true);
      setChangeInvalid(['currentPassword']);
      return;
    }
    if (newPwd !== newPwd2) 
    {
      setChangeMsg('Nowe hasła nie są identyczne');
      setChangeError(true);
      setChangeInvalid(['newPassword', 'confirmNewPassword']);
      return;
    }
    const pwdErr = validatePassword(newPwd);
    if (pwdErr) 
    {
      setChangeMsg(pwdErr);
      setChangeError(true);
      setChangeInvalid(['newPassword']);
      return;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) 
    {
      setChangeMsg('Brak autoryzacji. Zaloguj się ponownie.');
      setChangeError(true);
      return;
    }

    const baseUrl = API.replace(/\/$/, '');
    const endpoint = `${baseUrl}/api/v1/change-password/`;

    try 
    {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          current_password: curPwd,
          new_password: newPwd,
          new_password2: newPwd2,
        }),
      });

      const contentType = res.headers.get('content-type');
      let data = {};
      if (contentType && contentType.indexOf('application/json') !== -1) 
        data = await res.json();

      if (res.ok) 
      {
        setChangeMsg('Hasło zmieniono pomyślnie.');
        setChangeError(false);
        setCurPwd('');
        setNewPwd('');
        setNewPwd2('');
      } 
      else 
      {
        console.error('Change password error:', data);
        let err = 'Błąd zmiany hasła';
        if (data.detail) 
          err = data.detail;
        else if (data.current_password) 
          err = data.current_password[0];
        else if (data.new_password) 
          err = data.new_password[0];
        else if (data.non_field_errors) 
          err = data.non_field_errors[0];
        setChangeMsg(err);
        setChangeError(true);
        const inv = [];
        if (data.current_password) 
          inv.push('currentPassword');
        if (data.new_password) 
          inv.push('newPassword');
        setChangeInvalid(inv);
      }
    } 
    catch (err) 
    {
      console.error('Network Error:', err);
      setChangeMsg('Błąd połączenia z serwerem.');
      setChangeError(true);
    }
  };

  const Sidebar = ({ faceState, email, innerPage, setInnerPage, handleLogout }) => (
    <aside className="sidebar left-sidebar">
      <div className="sidebar-top">
        <div className="emoji-wrap">
          <EmojiFace state={faceState} size={100} />
        </div>
        <div className="user-email centered sidebar-email">{email || 'Użytkownik'}</div>
      </div>

      <nav className="sidebar-nav">
        <button 
          className={`nav-btn ${innerPage === 'home' ? 'active' : ''}`} 
          onClick={() => setInnerPage('home')}
        >
          Strona domowa
        </button>
        <button 
          className={`nav-btn ${innerPage === 'changePassword' ? 'active' : ''}`} 
          onClick={() => setInnerPage('changePassword')}
        >
          Zmiana hasła
        </button>
      </nav>

      <div className="sidebar-bottom">
        <button className="signout-btn" onClick={handleLogout}>Sign out</button>
      </div>
    </aside>
  );

  return (
    <div className="demo-root">
      {page === 'auth' && (
        <div className="card">
          <div className="left">
            <EmojiFace state={faceState} size={160} />
          </div>
          <div className="right">
            <div className="mode-toggle">
              <button 
                className={mode === 'login' ? 'active' : ''} 
                onClick={() => { setMode('login'); setMessage(''); setIsError(false); }}
              >
                Login
              </button>
              <button 
                className={mode === 'register' ? 'active' : ''} 
                onClick={() => { setMode('register'); setMessage(''); setIsError(false); }}
              >
                Register
              </button>
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
            <div className={`hint ${isError ? 'error' : ''}`}>{message}</div>
          </div>
        </div>
      )}

      {page === 'home' && (
        <div className="authenticated-left-root">
          <Sidebar 
            faceState={faceState} 
            email={email} 
            innerPage={innerPage} 
            setInnerPage={setInnerPage} 
            handleLogout={handleLogout} 
          />
          <main className="content-area centered-area">
            {innerPage === 'home' && <HomeContent />}
            {innerPage === 'changePassword' && (
              <ChangePasswordContent
                handleChangePassword={handleChangePassword}
                changeInvalid={changeInvalid}
                curPwd={curPwd}
                setCurPwd={setCurPwd}
                newPwd={newPwd}
                setNewPwd={setNewPwd}
                newPwd2={newPwd2}
                setNewPwd2={setNewPwd2}
                changeError={changeError}
                changeMsg={changeMsg}
              />
            )}
          </main>
        </div>
      )}
    </div>
  );
}