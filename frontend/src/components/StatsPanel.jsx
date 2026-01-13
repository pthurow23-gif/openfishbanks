import React from 'react';
import { formatCurrency } from '../utils/format';
import './StatsPanel.css';

function StatsPanel({ gameStats, userStats, onStatClick }) {
  if (!gameStats || !userStats) {
    return <div className="stats-panel">Loading stats...</div>;
  }

  return (
    <div className="stats-panel">
      <h2>Game Statistics</h2>
      
      <div className="stats-grid">
        <div 
          className="stat-card clickable" 
          onClick={() => onStatClick && onStatClick('total-players')}
        >
          <div className="stat-label">Total Players</div>
          <div className="stat-value">{gameStats.totalPlayers}</div>
        </div>

        <div 
          className="stat-card clickable"
          onClick={() => onStatClick && onStatClick('active-ships')}
        >
          <div className="stat-label">Active Ships</div>
          <div className="stat-value">{gameStats.activeShips}</div>
        </div>

        <div 
          className="stat-card clickable"
          onClick={() => onStatClick && onStatClick('fishing-areas')}
        >
          <div className="stat-label">Fishing Areas</div>
          <div className="stat-value">{gameStats.areas?.length || 0}</div>
        </div>
      </div>

      <div className="user-stats-section">
        <h3>Your Stats</h3>
        <div className="user-stats-grid">
          <div 
            className="user-stat-card clickable"
            onClick={() => onStatClick && onStatClick('balance')}
          >
            <div className="stat-label">Current Dollars</div>
            <div className="stat-value highlight">{formatCurrency(userStats.balance)}</div>
          </div>

          <div 
            className="user-stat-card clickable"
            onClick={() => onStatClick && onStatClick('ships-owned')}
          >
            <div className="stat-label">Ships Owned</div>
            <div className="stat-value">{userStats.ships?.length || 0}</div>
          </div>

          {userStats.clan && (
            <div className="user-stat-card">
              <div className="stat-label">Clan</div>
              <div className="stat-value">{userStats.clan.name}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default StatsPanel;