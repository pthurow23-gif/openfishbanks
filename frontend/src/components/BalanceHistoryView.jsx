import React, { useState, useEffect } from 'react';
import { gameAPI } from '../api';
import { formatCurrency } from '../utils/format';
import './BalanceHistoryView.css';

function BalanceHistoryView({ userStats, onBack }) {
  const [balanceHistory, setBalanceHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      // Get transaction history and calculate balance at each tick
      const history = userStats?.transactionHistory || [];
      const currentBalance = userStats?.balance || 0;
      
      // Reverse to show oldest first, then calculate balance backwards
      const reversed = [...history].reverse();
      let runningBalance = currentBalance;
      
      const historyWithBalance = reversed.map(tickGroup => {
        // Subtract the round's earnings to get balance before this round
        runningBalance -= tickGroup.totalProfit;
        return {
          ...tickGroup,
          balanceAfter: runningBalance + tickGroup.totalProfit,
          balanceBefore: runningBalance
        };
      }).reverse(); // Reverse back to show newest first
      
      // Add current balance as most recent
      if (historyWithBalance.length > 0) {
        historyWithBalance[0].balanceAfter = currentBalance;
      }
      
      setBalanceHistory(historyWithBalance);
    } catch (error) {
      console.error('Error loading balance history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTickTime = (tickTimeStr) => {
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

  if (loading) {
    return <div className="balance-history-view">Loading...</div>;
  }

  return (
    <div className="balance-history-view">
      <div className="view-header">
        <button onClick={onBack} className="back-button">← Back</button>
        <h2>Balance History</h2>
      </div>
      
      <div className="current-balance-display">
        <div className="current-balance-label">Current Balance</div>
        <div className="current-balance-value">
          {formatCurrency(userStats?.balance || 0)}
        </div>
      </div>

      <div className="balance-history-list">
        {balanceHistory.length === 0 ? (
          <p className="no-history">No transaction history yet</p>
        ) : (
          balanceHistory.map((tickGroup, index) => (
            <div key={tickGroup.tickTime} className="balance-history-item">
              <div className="balance-history-time">{formatTickTime(tickGroup.tickTime)}</div>
              <div className="balance-history-details">
                <div className="balance-row">
                  <span>Balance Before Round:</span>
                  <span>{formatCurrency(tickGroup.balanceBefore || 0)}</span>
                </div>
                <div className="balance-row">
                  <span>Round Earnings:</span>
                  <span className={tickGroup.totalProfit >= 0 ? 'positive' : 'negative'}>
                    {formatCurrency(tickGroup.totalProfit)}
                  </span>
                </div>
                <div className="balance-row balance-after">
                  <span>Balance After Round:</span>
                  <span className="balance-value">{formatCurrency(tickGroup.balanceAfter || 0)}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default BalanceHistoryView;
