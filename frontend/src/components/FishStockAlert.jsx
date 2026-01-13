import React, { useEffect, useState } from 'react';
import './FishStockAlert.css';

function FishStockAlert({ gameStats, onClose }) {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    if (!gameStats || !gameStats.areas) return;
    
    const newAlerts = [];
    gameStats.areas.forEach(area => {
      const stock = area.current_stock || 0;
      if (stock < 1000) {
        newAlerts.push({
          area: area.name,
          stock: stock,
          level: 'critical'
        });
      } else if (stock < 10000) {
        newAlerts.push({
          area: area.name,
          stock: stock,
          level: 'warning'
        });
      }
    });
    
    setAlerts(newAlerts);
  }, [gameStats]);

  if (alerts.length === 0) {
    return null;
  }

  return (
    <div className="fish-stock-alert-overlay" onClick={onClose}>
      <div className="fish-stock-alert" onClick={(e) => e.stopPropagation()}>
        <div className="alert-header">
          <h3>⚠️ Fish Stock Alert</h3>
          <button className="alert-close" onClick={onClose}>×</button>
        </div>
        <div className="alert-content">
          {alerts.map((alert, index) => (
            <div key={index} className={`alert-item ${alert.level}`}>
              <div className="alert-message">
                Fish in <strong>"{alert.area}"</strong> have declined below {alert.level === 'critical' ? '1,000' : '10,000'}
              </div>
              <div className="alert-stock">
                Current stock: {Math.round(alert.stock).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
        <button className="alert-acknowledge" onClick={onClose}>Acknowledge</button>
      </div>
    </div>
  );
}

export default FishStockAlert;
