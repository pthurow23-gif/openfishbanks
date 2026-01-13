import React from 'react';
import './Navigation.css';

function Navigation({ currentView, onViewChange }) {
  return (
    <nav className="navigation">
      <button
        className={`nav-item ${currentView === 'home' ? 'active' : ''}`}
        onClick={() => onViewChange('home')}
      >
        Home
      </button>
      <button
        className={`nav-item ${currentView === 'earnings' ? 'active' : ''}`}
        onClick={() => onViewChange('earnings')}
      >
        Earnings
      </button>
      <button
        className={`nav-item ${currentView === 'ships' ? 'active' : ''}`}
        onClick={() => onViewChange('ships')}
      >
        Ship Management
      </button>
    </nav>
  );
}

export default Navigation;