import React, { useState, useEffect } from 'react';
import './TickCountdown.css';

function TickCountdown({ lastTickTime, tickInterval }) {
  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    if (!lastTickTime || !tickInterval) return;

    const updateCountdown = () => {
      const now = Date.now();
      const elapsed = now - lastTickTime;
      const remaining = Math.max(0, tickInterval - elapsed);
      setTimeRemaining(Math.floor(remaining / 1000)); // Convert to seconds
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [lastTickTime, tickInterval]);

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;

  return (
    <div className="tick-countdown">
      <div className="countdown-label">Next Round In:</div>
      <div className="countdown-time">
        {minutes}:{seconds.toString().padStart(2, '0')}
      </div>
    </div>
  );
}

export default TickCountdown;