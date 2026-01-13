import React, { useState, useEffect } from 'react';
import { formatCurrency } from '../utils/format';
import './EarningsReport.css';

function EarningsReport({ userStats }) {
  const [expandedTicks, setExpandedTicks] = useState(new Set([0])); // First tick expanded by default
  const [showAllHistory, setShowAllHistory] = useState(false);

  if (!userStats) {
    return <div className="earnings-report">Loading...</div>;
  }

  const transactionHistory = userStats.transactionHistory || [];
  const lastRoundTotal = userStats.lastRoundTotal || 0;
  const lastTransaction = userStats.lastTransaction;

  // Show only recent ticks (last 5) unless "show all" is enabled
  const displayTicks = showAllHistory ? transactionHistory : transactionHistory.slice(0, 5);
  
  // Update expanded ticks set when display changes
  useEffect(() => {
    if (displayTicks.length > 0 && expandedTicks.size === 0) {
      setExpandedTicks(new Set([0])); // Expand first one by default
    }
  }, [displayTicks.length, expandedTicks.size]);

  const toggleTick = (index) => {
    const newExpanded = new Set(expandedTicks);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedTicks(newExpanded);
  };
  
  // Parse date string and format for display (EST)
  const formatTickTime = (tickTimeStr) => {
    // tickTimeStr is in format "YYYY-MM-DD HH:MM"
    const date = new Date(tickTimeStr.replace(' ', 'T') + ':00');
    return date.toLocaleString('en-US', {
      timeZone: 'America/New_York',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="earnings-report">
      <h2>Earnings Report</h2>
      
      <div className="earnings-summary">
        <div className="earnings-card total">
          <div className="earnings-label">Last Round Total</div>
          <div className={`earnings-value ${lastRoundTotal >= 0 ? 'positive' : 'negative'}`}>
            {formatCurrency(lastRoundTotal)}
          </div>
        </div>

        {transactionHistory.length > 0 ? (
          <div className="transaction-history">
            <div className="history-header">
              <h3>Transaction History</h3>
              {transactionHistory.length > 5 && (
                <button
                  className="toggle-history-btn"
                  onClick={() => setShowAllHistory(!showAllHistory)}
                >
                  {showAllHistory ? 'Show Recent Only' : 'Show All (All Rounds)'}
                </button>
              )}
            </div>

            <div className="ticks-list">
              {displayTicks.map((tickGroup, index) => {
                const isExpanded = expandedTicks.has(index);
                const isRecent = index === 0;
                
                return (
                  <div key={tickGroup.tickTime} className={`tick-group ${isRecent ? 'recent' : ''}`}>
                    <div 
                      className="tick-header"
                      onClick={() => toggleTick(index)}
                    >
                      <div className="tick-info">
                        <span className="tick-time">
                          {formatTickTime(tickGroup.tickTime)}
                        </span>
                        <span className={`tick-total ${tickGroup.totalProfit >= 0 ? 'positive' : 'negative'}`}>
                          Total: {formatCurrency(tickGroup.totalProfit)}
                        </span>
                        <span className="tick-count">
                          {tickGroup.transactions.length} transaction{tickGroup.transactions.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <span className="expand-icon">
                        {isExpanded ? '▼' : '▶'}
                      </span>
                    </div>

                    {isExpanded && (
                      <div className="tick-transactions">
                        {tickGroup.transactions.map((tx) => (
                          <div key={tx.id} className="transaction-item">
                            <div className="transaction-main">
                              <span className="transaction-area">{tx.area_name}</span>
                              <span className={`transaction-profit ${tx.profit >= 0 ? 'positive' : 'negative'}`}>
                                {formatCurrency(tx.profit)}
                              </span>
                            </div>
                            <div className="transaction-details-small">
                              <span>{tx.ship_name}</span>
                              <span>•</span>
                              <span>{tx.actual_harvest.toFixed(0)} {tx.fish_type}</span>
                              {tx.operating_cost && (
                                <>
                                  <span>•</span>
                                  <span>Operating: {formatCurrency(tx.operating_cost)}</span>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="no-transactions">
            <p>No transactions yet. Assign your ships to areas to start earning!</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default EarningsReport;