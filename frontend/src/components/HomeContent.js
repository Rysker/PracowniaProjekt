import React from 'react';

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

export default HomeContent;