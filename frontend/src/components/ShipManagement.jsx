import React, { useState, useEffect } from 'react';
import { shipsAPI, areasAPI } from '../api';
import { formatCurrency } from '../utils/format';
import './ShipManagement.css';

function ShipManagement({ userStats, onUpdate }) {
  const [ships, setShips] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [shipsResponse, areasResponse] = await Promise.all([
        shipsAPI.getAll(),
        areasAPI.getAll()
      ]);
      setShips(shipsResponse.data);
      setAreas(areasResponse.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBuyShip = async (shipId) => {
    try {
      await shipsAPI.buy(shipId);
      setMessage({ type: 'success', text: 'Ship purchased successfully!' });
      if (onUpdate) onUpdate();
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to buy ship' });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleAssignShip = async (userShipId, areaId) => {
    try {
      await shipsAPI.assign(userShipId, areaId);
      setMessage({ type: 'success', text: 'Ship assigned successfully!' });
      if (onUpdate) onUpdate();
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to assign ship' });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  if (loading) {
    return <div className="ship-management">Loading...</div>;
  }

  const userShips = userStats?.ships || [];
  const userBalance = userStats?.balance || 0;

  return (
    <div className="ship-management">
      <h2>Ship Management</h2>
      
      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="ship-management-grid">
        <div className="ship-list">
          <h3>Available Ships</h3>
          <div className="ships-grid">
            {ships.map(ship => {
              const canAfford = userBalance >= ship.cost;
              return (
                <div key={ship.id} className="ship-card">
                  <div className="ship-name">{ship.name}</div>
                  <div className="ship-details">
                    <div>Cost: ${ship.cost.toLocaleString()}</div>
                    <div>Harvest: {ship.harvest_amount.toFixed(0)} fish</div>
                    <div>Operating Cost: {formatCurrency(ship.operating_cost || 0)}/round</div>
                  </div>
                  <button
                    onClick={() => handleBuyShip(ship.id)}
                    disabled={!canAfford}
                    className={`btn-buy ${canAfford ? '' : 'disabled'}`}
                  >
                    {canAfford ? 'Buy' : 'Insufficient Funds'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="user-ships-list">
          <h3>Your Ships ({userShips.length})</h3>
          {userShips.length === 0 ? (
            <p>You don't have any ships yet. Buy one from the list!</p>
          ) : (
            <div className="user-ships">
              {userShips.map(userShip => (
                <div key={userShip.id} className="user-ship-card">
                  <div className="user-ship-info">
                    <div className="user-ship-name">{userShip.ship_name}</div>
                    <div className="user-ship-details">
                      Harvest: {userShip.harvest_amount.toFixed(0)} fish
                      <br />
                      Operating Cost: {formatCurrency(userShip.operating_cost || 0)}/round
                    </div>
                    <div className="user-ship-area">
                      {userShip.area_name ? (
                        <span>📍 {userShip.area_name} ({userShip.fish_type})</span>
                      ) : (
                        <span className="not-assigned">Not assigned to any area</span>
                      )}
                    </div>
                  </div>
                  <div className="ship-assign">
                    <select
                      value={userShip.area_id || ''}
                      onChange={(e) => handleAssignShip(userShip.id, e.target.value ? parseInt(e.target.value) : null)}
                    >
                      <option value="">-- Select Area --</option>
                      {areas.map(area => (
                        <option key={area.id} value={area.id}>
                          {area.name} ({area.fish_type}) - ${area.fish_price}/fish
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ShipManagement;