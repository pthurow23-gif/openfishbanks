import React, { useState, useEffect } from 'react';
import { adminAPI, clansAPI, shipsAPI } from '../api';
import './AdminPanel.css';

function AdminPanel() {
  const [areas, setAreas] = useState([]);
  const [clans, setClans] = useState([]);
  const [users, setUsers] = useState([]);
  const [ships, setShips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingStates, setLoadingStates] = useState({});
  const [message, setMessage] = useState(null);
  const [editingArea, setEditingArea] = useState(null);
  const [editingShip, setEditingShip] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [currentView, setCurrentView] = useState('areas');
  const [showCreateArea, setShowCreateArea] = useState(false);
  const [newAreaForm, setNewAreaForm] = useState({
    name: '',
    areaType: 'Bay',
    fishType: '',
    currentStock: '',
    maxStock: '',
    fishPrice: '',
    regenerationRate: '0.1'
  });

  useEffect(() => {
    loadAreas();
    loadClans();
    loadUsers();
    loadShips();
  }, []);

  const loadAreas = async () => {
    try {
      const response = await adminAPI.getAreas();
      setAreas(response.data);
    } catch (error) {
      console.error('Error loading areas:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadClans = async () => {
    try {
      const response = await clansAPI.getAll();
      setClans(response.data);
    } catch (error) {
      console.error('Error loading clans:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await adminAPI.getUsers();
      setUsers(response.data);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadShips = async () => {
    try {
      const response = await shipsAPI.getAll();
      setShips(response.data);
    } catch (error) {
      console.error('Error loading ships:', error);
    }
  };

  const handleDeleteClan = async (clanId) => {
    if (!window.confirm('Are you sure you want to delete this clan? All members will be removed.')) {
      return;
    }

    setLoadingState(`delete-clan-${clanId}`, true);
    try {
      await adminAPI.deleteClan(clanId);
      showMessage('success', 'Clan deleted successfully');
      loadClans();
    } catch (error) {
      showMessage('error', error.response?.data?.error || 'Failed to delete clan');
    } finally {
      setLoadingState(`delete-clan-${clanId}`, false);
    }
  };

  const handleModifyBalance = async (userId, amount) => {
    setLoadingState(`balance-${userId}`, true);
    try {
      await adminAPI.modifyUserBalance(userId, amount);
      showMessage('success', `Balance modified successfully`);
      loadUsers();
    } catch (error) {
      showMessage('error', error.response?.data?.error || 'Failed to modify balance');
    } finally {
      setLoadingState(`balance-${userId}`, false);
    }
  };

  const handleAddShip = async (userId, shipId) => {
    setLoadingState(`add-ship-${userId}`, true);
    try {
      await adminAPI.addShipToUser(userId, shipId);
      showMessage('success', 'Ship added successfully');
      loadUsers();
    } catch (error) {
      showMessage('error', error.response?.data?.error || 'Failed to add ship');
    } finally {
      setLoadingState(`add-ship-${userId}`, false);
    }
  };

  const handleRemoveShip = async (userId, userShipId) => {
    if (!window.confirm('Are you sure you want to remove this ship?')) {
      return;
    }
    setLoadingState(`remove-ship-${userShipId}`, true);
    try {
      await adminAPI.removeShipFromUser(userId, userShipId);
      showMessage('success', 'Ship removed successfully');
      loadUsers();
    } catch (error) {
      showMessage('error', error.response?.data?.error || 'Failed to remove ship');
    } finally {
      setLoadingState(`remove-ship-${userShipId}`, false);
    }
  };

  const handleSetShipOperatingCost = async (shipId, operatingCost) => {
    setLoadingState(`ship-cost-${shipId}`, true);
    try {
      await adminAPI.setShipOperatingCost(shipId, operatingCost);
      showMessage('success', 'Ship operating cost updated');
      loadShips();
      setEditingShip(null);
      setEditValues({});
    } catch (error) {
      showMessage('error', error.response?.data?.error || 'Failed to update operating cost');
    } finally {
      setLoadingState(`ship-cost-${shipId}`, false);
    }
  };

  const setLoadingState = (key, value) => {
    setLoadingStates(prev => ({ ...prev, [key]: value }));
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleProcessTick = async () => {
    setLoadingState('tick', true);
    try {
      const response = await adminAPI.processTick();
      showMessage('success', `Tick processed: ${response.data.result.processedCount} ships processed`);
      loadAreas();
    } catch (error) {
      showMessage('error', error.response?.data?.error || 'Failed to process tick');
    } finally {
      setLoadingState('tick', false);
    }
  };

  const handleResetStock = async (areaId, amount) => {
    setLoadingState(`reset-${areaId}`, true);
    try {
      await adminAPI.resetAreaStock(areaId, amount);
      showMessage('success', `Stock reset for area`);
      loadAreas();
    } catch (error) {
      showMessage('error', error.response?.data?.error || 'Failed to reset stock');
    } finally {
      setLoadingState(`reset-${areaId}`, false);
    }
  };

  const handleAddFish = async (areaId, amount) => {
    setLoadingState(`add-${areaId}`, true);
    try {
      await adminAPI.addFishToArea(areaId, amount);
      showMessage('success', `Added ${amount} fish to area`);
      loadAreas();
    } catch (error) {
      showMessage('error', error.response?.data?.error || 'Failed to add fish');
    } finally {
      setLoadingState(`add-${areaId}`, false);
    }
  };

  const handleSetRegenerationRate = async (areaId, rate) => {
    setLoadingState(`rate-${areaId}`, true);
    try {
      await adminAPI.setAreaRegenerationRate(areaId, rate);
      showMessage('success', `Regeneration rate updated`);
      loadAreas();
      setEditingArea(null);
    } catch (error) {
      showMessage('error', error.response?.data?.error || 'Failed to set rate');
    } finally {
      setLoadingState(`rate-${areaId}`, false);
    }
  };

  const handleSetFishPrice = async (areaId, price) => {
    setLoadingState(`price-${areaId}`, true);
    try {
      await adminAPI.setAreaFishPrice(areaId, price);
      showMessage('success', `Fish price updated`);
      loadAreas();
      setEditingArea(null);
    } catch (error) {
      showMessage('error', error.response?.data?.error || 'Failed to set price');
    } finally {
      setLoadingState(`price-${areaId}`, false);
    }
  };

  const handleCreateArea = async () => {
    if (!newAreaForm.name || !newAreaForm.fishType || !newAreaForm.maxStock || !newAreaForm.fishPrice) {
      showMessage('error', 'Please fill in all required fields (Name, Fish Type, Max Stock, Fish Price)');
      return;
    }
    setLoadingState('create-area', true);
    try {
      await adminAPI.createArea({
        name: newAreaForm.name,
        areaType: newAreaForm.areaType,
        fishType: newAreaForm.fishType,
        currentStock: parseFloat(newAreaForm.currentStock) || parseFloat(newAreaForm.maxStock),
        maxStock: parseFloat(newAreaForm.maxStock),
        fishPrice: parseFloat(newAreaForm.fishPrice),
        regenerationRate: parseFloat(newAreaForm.regenerationRate) || 0.1
      });
      showMessage('success', 'Area created successfully');
      setShowCreateArea(false);
      setNewAreaForm({
        name: '',
        areaType: 'Bay',
        fishType: '',
        currentStock: '',
        maxStock: '',
        fishPrice: '',
        regenerationRate: '0.1'
      });
      loadAreas();
    } catch (error) {
      showMessage('error', error.response?.data?.error || 'Failed to create area');
    } finally {
      setLoadingState('create-area', false);
    }
  };

  if (loading) {
    return <div className="admin-panel">Loading areas...</div>;
  }

  return (
    <div className="admin-panel">
      <h2>🔧 Admin Panel</h2>
      
      {message && (
        <div className={`admin-message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="admin-controls">
        <button
          onClick={handleProcessTick}
          disabled={loadingStates.tick}
          className="btn-admin btn-primary"
        >
          {loadingStates.tick ? 'Processing...' : 'Force Tick (Process All Ships)'}
        </button>
      </div>

      <nav className="admin-navigation">
        <button
          className={`admin-nav-item ${currentView === 'areas' ? 'active' : ''}`}
          onClick={() => setCurrentView('areas')}
        >
          Areas
        </button>
        <button
          className={`admin-nav-item ${currentView === 'clans' ? 'active' : ''}`}
          onClick={() => setCurrentView('clans')}
        >
          Clans
        </button>
        <button
          className={`admin-nav-item ${currentView === 'users' ? 'active' : ''}`}
          onClick={() => setCurrentView('users')}
        >
          Users
        </button>
        <button
          className={`admin-nav-item ${currentView === 'ships' ? 'active' : ''}`}
          onClick={() => setCurrentView('ships')}
        >
          Ships
        </button>
      </nav>

      {currentView === 'areas' && (
      <div className="admin-areas">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3>Fishing Areas (Stock Information)</h3>
          <button
            onClick={() => setShowCreateArea(!showCreateArea)}
            className="btn-action"
          >
            {showCreateArea ? 'Cancel' : 'Create New Area'}
          </button>
        </div>

        {showCreateArea && (
          <div className="create-area-form">
            <h4>Create New Fishing Area</h4>
            <div className="create-area-grid">
              <div>
                <label>Area Name *</label>
                <input
                  type="text"
                  placeholder="e.g., Golden Bay"
                  value={newAreaForm.name}
                  onChange={(e) => setNewAreaForm({...newAreaForm, name: e.target.value})}
                />
              </div>
              <div>
                <label>Area Type *</label>
                <select
                  value={newAreaForm.areaType}
                  onChange={(e) => setNewAreaForm({...newAreaForm, areaType: e.target.value})}
                >
                  <option value="Bay">Bay</option>
                  <option value="Ocean">Ocean</option>
                  <option value="Lake">Lake</option>
                  <option value="River">River</option>
                </select>
              </div>
              <div>
                <label>Fish Type *</label>
                <input
                  type="text"
                  placeholder="e.g., Salmon, Tuna"
                  value={newAreaForm.fishType}
                  onChange={(e) => setNewAreaForm({...newAreaForm, fishType: e.target.value})}
                />
              </div>
              <div>
                <label>Current Stock</label>
                <input
                  type="number"
                  placeholder="Defaults to Max Stock"
                  value={newAreaForm.currentStock}
                  onChange={(e) => setNewAreaForm({...newAreaForm, currentStock: e.target.value})}
                />
              </div>
              <div>
                <label>Max Stock *</label>
                <input
                  type="number"
                  placeholder="e.g., 50000"
                  value={newAreaForm.maxStock}
                  onChange={(e) => setNewAreaForm({...newAreaForm, maxStock: e.target.value})}
                />
              </div>
              <div>
                <label>Fish Price ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g., 5.00"
                  value={newAreaForm.fishPrice}
                  onChange={(e) => setNewAreaForm({...newAreaForm, fishPrice: e.target.value})}
                />
              </div>
              <div>
                <label>Regeneration Rate (0-1)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g., 0.1 (10%)"
                  value={newAreaForm.regenerationRate}
                  onChange={(e) => setNewAreaForm({...newAreaForm, regenerationRate: e.target.value})}
                />
              </div>
            </div>
            <button
              onClick={handleCreateArea}
              disabled={loadingStates['create-area']}
              className="btn-action"
              style={{ marginTop: '1rem' }}
            >
              {loadingStates['create-area'] ? 'Creating...' : 'Create Area'}
            </button>
          </div>
        )}

        <div className="areas-grid">
          {areas.map(area => (
            <div key={area.id} className="admin-area-card">
              <div className="area-header">
                <h4>{area.name}</h4>
                <span className="area-type">{area.area_type}</span>
              </div>
              
              <div className="area-info">
                <div className="info-row">
                  <span className="info-label">Fish Type:</span>
                  <span className="info-value">{area.fish_type}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Current Stock:</span>
                  <span className="info-value stock-value">
                    {Math.round(area.current_stock).toLocaleString()} / {Math.round(area.max_stock).toLocaleString()}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Fish Price:</span>
                  <span className="info-value">${area.fish_price.toFixed(2)}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Regeneration Rate:</span>
                  <span className="info-value">{(area.regeneration_rate * 100).toFixed(1)}%</span>
                </div>
              </div>

              <div className="area-actions">
                <div className="action-group">
                  <input
                    type="number"
                    placeholder="Amount"
                    id={`reset-${area.id}`}
                    defaultValue={area.max_stock}
                  />
                  <button
                    onClick={() => handleResetStock(area.id, parseFloat(document.getElementById(`reset-${area.id}`).value))}
                    disabled={loadingStates[`reset-${area.id}`]}
                    className="btn-action"
                  >
                    Reset Stock
                  </button>
                </div>
                <div className="action-group">
                  <input
                    type="number"
                    placeholder="Amount"
                    id={`add-${area.id}`}
                  />
                  <button
                    onClick={() => handleAddFish(area.id, parseFloat(document.getElementById(`add-${area.id}`).value))}
                    disabled={loadingStates[`add-${area.id}`]}
                    className="btn-action"
                  >
                    Add Fish
                  </button>
                </div>
                {editingArea === area.id ? (
                  <div className="edit-controls">
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Regen Rate (0-1)"
                      value={editValues.rate !== undefined ? editValues.rate : area.regeneration_rate}
                      onChange={(e) => setEditValues({...editValues, rate: parseFloat(e.target.value)})}
                    />
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Price"
                      value={editValues.price !== undefined ? editValues.price : area.fish_price}
                      onChange={(e) => setEditValues({...editValues, price: parseFloat(e.target.value)})}
                    />
                    <button
                      onClick={() => {
                        if (editValues.rate !== undefined) handleSetRegenerationRate(area.id, editValues.rate);
                        if (editValues.price !== undefined) handleSetFishPrice(area.id, editValues.price);
                      }}
                      className="btn-action"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditingArea(null);
                        setEditValues({});
                      }}
                      className="btn-action btn-cancel"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setEditingArea(area.id)}
                    className="btn-action"
                  >
                    Edit Rate/Price
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      )}

      {currentView === 'clans' && (
      <div className="admin-clans">
        <h3>Clans Management</h3>
        <div className="clans-list-admin">
          {clans.length === 0 ? (
            <p>No clans exist</p>
          ) : (
            clans.map(clan => (
              <div key={clan.id} className="admin-clan-item">
                <div className="admin-clan-info">
                  <span className="admin-clan-name">{clan.name}</span>
                  <span className="admin-clan-members">{clan.member_count} members</span>
                </div>
                <button
                  onClick={() => handleDeleteClan(clan.id)}
                  disabled={loadingStates[`delete-clan-${clan.id}`]}
                  className="btn-delete-clan"
                >
                  {loadingStates[`delete-clan-${clan.id}`] ? 'Deleting...' : 'Delete Clan'}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
      )}

      {currentView === 'users' && (
      <div className="admin-users">
        <h3>User Management</h3>
        <div className="users-list-admin">
          {users.length === 0 ? (
            <p>No users found</p>
          ) : (
            users.map(user => (
              <div key={user.id} className="admin-user-item">
                <div className="admin-user-info">
                  <div className="admin-user-name">{user.username}</div>
                  <div className="admin-user-stats">
                    <span>Balance: ${parseFloat(user.balance || 0).toFixed(2)}</span>
                    <span>Ships: {user.ship_count || 0}</span>
                  </div>
                </div>
                <div className="admin-user-actions">
                  <div className="action-group-small">
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Amount"
                      id={`balance-${user.id}`}
                    />
                    <button
                      onClick={() => handleModifyBalance(user.id, parseFloat(document.getElementById(`balance-${user.id}`).value || 0))}
                      disabled={loadingStates[`balance-${user.id}`]}
                      className="btn-action-small"
                    >
                      {loadingStates[`balance-${user.id}`] ? '...' : 'Modify Balance'}
                    </button>
                  </div>
                  <div className="action-group-small">
                    <select id={`ship-${user.id}`}>
                      <option value="">Select Ship</option>
                      {ships.map(ship => (
                        <option key={ship.id} value={ship.id}>{ship.name}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => {
                        const shipId = document.getElementById(`ship-${user.id}`).value;
                        if (shipId) handleAddShip(user.id, parseInt(shipId));
                      }}
                      disabled={loadingStates[`add-ship-${user.id}`]}
                      className="btn-action-small"
                    >
                      Add Ship
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      )}

      {currentView === 'ships' && (
      <div className="admin-ships">
        <h3>Ship Management ({ships.length} ships)</h3>
        <div className="ships-admin-list">
          {ships.length === 0 ? (
            <p>No ships found</p>
          ) : (
            ships.map(ship => (
              <div key={ship.id} className="admin-ship-item">
                <div className="admin-ship-info">
                  <div className="admin-ship-name">{ship.name}</div>
                  <div className="admin-ship-details">
                    <span>Cost: ${ship.cost.toLocaleString()}</span>
                    <span>Harvest: {ship.harvest_amount.toFixed(0)}</span>
                    <span>Operating Cost: ${(ship.operating_cost || 0).toFixed(2)}/round</span>
                  </div>
                </div>
                {editingShip === ship.id ? (
                  <div className="edit-ship-cost">
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Operating Cost"
                      value={editValues.operatingCost !== undefined ? editValues.operatingCost : ship.operating_cost || 0}
                      onChange={(e) => setEditValues({...editValues, operatingCost: parseFloat(e.target.value)})}
                    />
                    <button
                      onClick={() => handleSetShipOperatingCost(ship.id, editValues.operatingCost)}
                      disabled={loadingStates[`ship-cost-${ship.id}`]}
                      className="btn-action-small"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditingShip(null);
                        setEditValues({});
                      }}
                      className="btn-action-small btn-cancel"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setEditingShip(ship.id)}
                    className="btn-action-small"
                  >
                    Edit Operating Cost
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
      )}
    </div>
  );
}

export default AdminPanel;