import React, { useState, useEffect } from 'react';
import { areasAPI } from '../api';
import { formatCurrency } from '../utils/format';
import './FishingAreasView.css';

function FishingAreasView({ onBack }) {
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const response = await areasAPI.getAll();
      setAreas(response.data);
    } catch (error) {
      console.error('Error loading areas:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="fishing-areas-view">Loading...</div>;
  }

  return (
    <div className="fishing-areas-view">
      <div className="view-header">
        <button onClick={onBack} className="back-button">← Back</button>
        <h2>Fishing Areas</h2>
      </div>
      
      <div className="areas-list">
        {areas.length === 0 ? (
          <p>No areas found</p>
        ) : (
          areas.map(area => (
            <div key={area.id} className="area-info-card">
              <div className="area-header-info">
                <h3>{area.name}</h3>
                <span className="area-type-badge">{area.area_type}</span>
              </div>
              <div className="area-details-grid">
                <div className="area-detail-item">
                  <span className="detail-label">Fish Type:</span>
                  <span className="detail-value">{area.fish_type}</span>
                </div>
                <div className="area-detail-item">
                  <span className="detail-label">Price per Fish:</span>
                  <span className="detail-value">{formatCurrency(area.fish_price)}</span>
                </div>
                <div className="area-detail-item">
                  <span className="detail-label">Current Round Stock:</span>
                  <span className="detail-value">{Math.round(area.current_stock || 0).toLocaleString()}</span>
                </div>
                <div className="area-detail-item">
                  <span className="detail-label">Max Stock:</span>
                  <span className="detail-value">{Math.round(area.max_stock || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default FishingAreasView;
