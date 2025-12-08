import React from 'react';
import EmojiFace from './EmojiFace';

const Sidebar = ({ email, faceState, currentPage, onNavigate, onLogout }) => (
  <aside className="sidebar left-sidebar">
    <div className="sidebar-top">
      <div className="emoji-wrap">
        <EmojiFace state={faceState} size={100} />
      </div>
      <div className="user-email centered sidebar-email">{email}</div>
    </div>
    <nav className="sidebar-nav">
      <button 
        className={`nav-btn ${currentPage === 'home' ? 'active' : ''}`} 
        onClick={() => onNavigate('home')}
      >
        Start
      </button>
      <button 
        className={`nav-btn ${currentPage === 'settings2fa' ? 'active' : ''}`} 
        onClick={() => onNavigate('settings2fa')}
      >
        2FA
      </button>
      <button 
        className={`nav-btn ${currentPage === 'changePassword' ? 'active' : ''}`} 
        onClick={() => onNavigate('changePassword')}
      >
        Zmiana hasła
      </button>
    </nav>
    <div className="sidebar-bottom">
      <button className="signout-btn" onClick={onLogout}>Wyloguj</button>
    </div>
  </aside>
);

export default Sidebar;