import React, { useState } from 'react';
import EmojiFace from '../components/EmojiFace';
import LoginForm from '../components/LoginForm';
import RegisterForm from '../components/RegisterForm';
import ChangePassword from '../components/ChangePassword';
import TwoFaForm from '../components/TwoFaForm';
import TwoFaSettings from '../components/TwoFaSettings';
import Sidebar from '../components/Sidebar';
import HomeContent from '../components/HomeContent';

import { authApi } from '../api/authApi';
import { validateEmail, validatePassword } from '../utils/validators';
import { useFaceAnim } from '../hooks/useFaceAnim';
import '../styles/App.css';

export default function App() 
{
  const [page, setPage] = useState('auth');
  const [innerPage, setInnerPage] = useState('home');
  const [mode, setMode] = useState('login');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [invalidFields, setInvalidFields] = useState([]);
  
  const [is2FaLogin, setIs2FaLogin] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [twoFaCode, setTwoFaCode] = useState('');

  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  
  const { faceState, setFaceState, triggerErrorAnim, triggerSuccessAnim } = useFaceAnim(email, password, showPassword, isError);


  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setMessage(''); setIsError(false); setInvalidFields([]);

    if (!validateEmail(email)) 
      return handleError('Nieprawidłowy email');
    if (mode === 'register') 
    {
      if (password !== confirmPassword) 
        return handleError('Hasła nie są identyczne');
      const pwdErr = validatePassword(password);
      if (pwdErr) 
        return handleError(pwdErr);
    }

    try 
    {
      const payload = { email, password, re_password: confirmPassword };
      const action = mode === 'login' ? authApi.login : authApi.register;
      
      const data = await action(payload);

      if (!data.ok && !data.token && !data['2fa_required']) 
      {
        handleError(data.error || 'Błąd', data.invalid);
        return;
      }

      if (mode === 'register') 
      {
        triggerSuccessAnim();
        setMessage('Konto utworzone! Przekierowanie...');
        setTimeout(() => {
          setMode('login');
          setPassword(''); setConfirmPassword(''); setMessage('');
        }, 2000);
      } 
      else 
      {
        if (data['2fa_required']) 
        {
          setTempToken(data.temp_token);
          setIs2FaLogin(true);
          setFaceState('peek');
        } 
        else 
        {
          loginUser(data);
        }
      }
    } 
    catch (err) 
    {
      handleError('Błąd połączenia z serwerem');
    }
  };

  const handle2FASubmit = async () => {
    if (twoFaCode.length < 6) 
      return handleError('Kod za krótki');
    
    try 
    {
      const data = await authApi.verify2FA(tempToken, twoFaCode);
      if (data.token) 
      {
        loginUser(data);
      } 
      else 
      {
        handleError(data.error || 'Błąd kodu');
        setFaceState('sad');
      }
    } 
    catch (err) 
    {
      handleError('Błąd sieci');
    }
  };

  const loginUser = (data) => {
    localStorage.setItem('accessToken', data.token);
    localStorage.setItem('refreshToken', data.refresh);
    triggerSuccessAnim();
    setPage('dashboard');
    setInnerPage('home');
    setIs2FaLogin(false);
    setMessage('');
  };

  const handleLogout = () => {
    localStorage.clear();
    setPage('auth');
    setEmail(''); setPassword(''); setIs2FaLogin(false);
    setFaceState('idle');
  };

  const handleError = (msg, fields = []) => {
    setMessage(msg);
    setIsError(true);
    setInvalidFields(fields);
    triggerErrorAnim();
  };

  // --- Render ---

  if (page === 'auth') 
  {
    if (is2FaLogin) 
    {
      return (
        <div className="demo-root center-xy">
          <TwoFaForm 
            code={twoFaCode} setCode={setTwoFaCode}
            onSubmit={handle2FASubmit} onCancel={handleLogout}
            message={message} isError={isError}
          />
        </div>
      );
    }

    return (
      <div className="demo-root">
        <div className="card">
          <div className="left"><EmojiFace state={faceState} size={160} /></div>
          <div className="right">
            <div className="mode-toggle">
              <button className={mode==='login'?'active':''} onClick={()=>setMode('login')}>Login</button>
              <button className={mode==='register'?'active':''} onClick={()=>setMode('register')}>Rejestracja</button>
            </div>
            
            {mode === 'login' ? (
              <LoginForm 
                email={email} setEmail={setEmail}
                password={password} setPassword={setPassword}
                showPassword={showPassword} setShowPassword={setShowPassword}
                onSubmit={handleAuthSubmit}
                invalidFields={invalidFields}
                setFaceState={setFaceState}
              />
            ) : (
              <RegisterForm 
                email={email} setEmail={setEmail}
                password={password} setPassword={setPassword}
                confirmPassword={confirmPassword} setConfirmPassword={setConfirmPassword}
                showPassword={showPassword} setShowPassword={setShowPassword}
                onSubmit={handleAuthSubmit}
                invalidFields={invalidFields}
                setFaceState={setFaceState}
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
        <Sidebar 
          email={email} 
          faceState={faceState} 
          currentPage={innerPage}
          onNavigate={setInnerPage} 
          onLogout={handleLogout} 
        />
        <main className="content-area centered-area">
          {innerPage === 'home' && <HomeContent />}
          {innerPage === 'settings2fa' && <TwoFaSettings />}
          {innerPage === 'changePassword' && <ChangePassword />}
        </main>
      </div>
    </div>
  );
}