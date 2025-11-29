import React from 'react';

const ChangePasswordContent = ({
                                 handleChangePassword,
                                 changeInvalid,
                                 curPwd,
                                 setCurPwd,
                                 newPwd,
                                 setNewPwd,
                                 newPwd2,
                                 setNewPwd2,
                                 changeError,
                                 changeMsg
                               }) => {
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
           />
         </div>

         {changeMsg && (
          <div className={`hint ${changeError ? 'error' : ''}`} style={{marginTop: 5, fontSize: 14, fontWeight: 500}}>
            {changeMsg}
          </div>
         )}

         <div className="actions" style={{marginTop: 10}}>
           <button className="submit" style={{width: '100%', padding: 12, fontSize: 16, fontWeight: 600}}>Zmień hasło</button>
         </div>
       </form>
     </div>
   </div>
  );
};

export default ChangePasswordContent;