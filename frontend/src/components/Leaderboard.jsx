import React, { useState, useEffect } from 'react';
import { gameAPI } from '../api';
import { formatCurrency } from '../utils/format';
import './Leaderboard.css';

function Leaderboard({ expanded, onToggleExpand }) {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
    const interval = setInterval(loadLeaderboard, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (expanded) {
      loadLeaderboard();
    }
  }, [expanded]);

  const loadLeaderboard = async () => {
    try {
      const response = await gameAPI.getLeaderboard(expanded ? 100 : 10);
      setLeaders(response.data);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="leaderboard">
        <h2 onClick={onToggleExpand} style={{ cursor: 'pointer' }}>🏆 Leaderboard</h2>
        <div className="leaderboard-loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className={`leaderboard ${expanded ? 'expanded' : ''}`}>
      <h2 onClick={onToggleExpand} style={{ cursor: 'pointer' }}>
        🏆 Leaderboard {expanded ? '▼' : '▶'}
      </h2>
      {expanded ? (
        <div className="leaderboard-expanded">
          <div className="leaderboard-expanded-list">
            {leaders.length === 0 ? (
              <div className="leaderboard-empty">No players yet</div>
            ) : (
              leaders.map((leader, index) => (
                <div key={leader.id} className="leaderboard-expanded-item">
                  <div className="leaderboard-expanded-rank">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                  </div>
                  <div className="leaderboard-expanded-info">
                    <div className="leaderboard-expanded-username">{leader.username}</div>
                    <div className="leaderboard-expanded-details">
                      <div className="detail-item">
                        <span className="detail-label">Current $:</span>
                        <span className="detail-value">{formatCurrency(leader.balance)}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label"># Ships Owned:</span>
                        <span className="detail-value">{leader.ship_count || 0}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Total Earnings per Round:</span>
                        <span className="detail-value">{formatCurrency(leader.last_round_earnings || 0)}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Total Earnings to Date:</span>
                        <span className="detail-value">{formatCurrency(leader.total_profit || 0)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="leaderboard-list">
          {leaders.length === 0 ? (
            <div className="leaderboard-empty">No players yet</div>
          ) : (
            leaders.map((leader, index) => (
              <div key={leader.id} className="leaderboard-item">
                <div className="leaderboard-rank">
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                </div>
                <div className="leaderboard-info">
                  <div className="leaderboard-username">{leader.username}</div>
                  <div className="leaderboard-stats">
                    <span>{formatCurrency(leader.balance)}</span>
                    <span className="leaderboard-ships">
                      {leader.ship_count || 0} ships
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default Leaderboard;
