import React, { useState } from 'react';
import { gameAPI } from '../api';
import './HarvestForm.css';

function HarvestForm({ userStats, onSubmit }) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const harvestAmount = parseFloat(amount);
    
    if (isNaN(harvestAmount) || harvestAmount <= 0) {
      setMessage({ type: 'error', text: 'Please enter a valid positive number' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      await gameAPI.submitHarvest(harvestAmount);
      setMessage({ type: 'success', text: `Harvest of ${harvestAmount.toFixed(2)} units submitted! It will be processed on the next tick.` });
      setAmount('');
      if (onSubmit) {
        onSubmit();
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Failed to submit harvest' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="harvest-form">
      <h2>Submit Harvest</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="harvest-amount">Harvest Amount</label>
          <input
            id="harvest-amount"
            type="number"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount to harvest"
            required
            disabled={loading}
          />
          <div className="form-hint">
            Your harvest will be processed on the next 15-minute tick. If total harvests exceed available fish, your harvest will be scaled proportionally.
          </div>
        </div>

        {message && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}

        <button type="submit" className="btn-submit" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit Harvest'}
        </button>
      </form>
    </div>
  );
}

export default HarvestForm;