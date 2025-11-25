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
      <h2>Zmień hasło</h2>
      <form 
        className="form" 
        onSubmit={handleChangePassword} 
        style={{maxWidth: 420, marginTop: 12, textAlign: 'left'}}
      >
        <label className="label">Aktualne hasło</label>
        <input
          className={`input ${changeInvalid.includes('currentPassword') ? 'invalid' : ''}`}
          type="password"
          value={curPwd}
          onChange={(e) => setCurPwd(e.target.value)}
          placeholder="Aktualne hasło"
        />

        <label className="label" style={{marginTop: 8}}>Nowe hasło</label>
        <input
          className={`input ${changeInvalid.includes('newPassword') ? 'invalid' : ''}`}
          type="password"
          value={newPwd}
          onChange={(e) => setNewPwd(e.target.value)}
          placeholder="Nowe hasło"
        />

        <label className="label" style={{marginTop: 8}}>Powtórz nowe hasło</label>
        <input
          className={`input ${changeInvalid.includes('confirmNewPassword') ? 'invalid' : ''}`}
          type="password"
          value={newPwd2}
          onChange={(e) => setNewPwd2(e.target.value)}
          placeholder="Powtórz nowe hasło"
        />

        <div className={`hint ${changeError ? 'error' : ''}`} style={{marginTop: 10}}>
          {changeMsg}
        </div>

        <div className="actions" style={{marginTop: 12}}>
          <button className="submit">Zmień hasło</button>
        </div>
      </form>
    </div>
  );
};

export default ChangePasswordContent;