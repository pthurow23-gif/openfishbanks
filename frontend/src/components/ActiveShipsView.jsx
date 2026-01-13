import React, { useState, useEffect } from 'react';
import { gameAPI } from '../api';
import './ActiveShipsView.css';

function ActiveShipsView({ onBack }) {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await gameAPI.getPlayersShips();
      setPlayers(response.data);
    } catch (error) {
      console.error('Error loading players ships:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="active-ships-view">Loading...</div>;
  }

  return (
    <div className="active-ships-view">
      <div className="view-header">
        <button onClick={onBack} className="back-button">← Back</button>
        <h2>Active Ships by Player</h2>
      </div>
      
      <div className="players-ships-list">
        {players.length === 0 ? (
          <p>No players found</p>
        ) : (
          players.map(player => (
            <div key={player.id} className="player-ships-card">
              <div className="player-name">{player.username}</div>
              <div className="player-ships">
                {player.ships && player.ships.length > 0 ? (
                  player.ships.map(ship => (
                    <div key={ship.id} className="ship-info-item">
                      <span className="ship-name">{ship.ship_name}</span>
                      {ship.area_name && (
                        <span className="ship-area">📍 {ship.area_name}</span>
                      )}
                      {!ship.area_name && (
                        <span className="ship-area unassigned">Not assigned</span>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="no-ships">No ships</div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default ActiveShipsView;
