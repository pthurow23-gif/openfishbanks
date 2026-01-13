import React, { useState, useEffect } from 'react';
import { gameAPI } from '../api';
import StatsPanel from './StatsPanel';
import ShipManagement from './ShipManagement';
import ClanManagement from './ClanManagement';
import Leaderboard from './Leaderboard';
import TickCountdown from './TickCountdown';
import Navigation from './Navigation';
import EarningsReport from './EarningsReport';
import ActiveShipsView from './ActiveShipsView';
import FishingAreasView from './FishingAreasView';
import BalanceHistoryView from './BalanceHistoryView';
import './Dashboard.css';

function Dashboard({ user }) {
  const [gameStats, setGameStats] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastTickTime, setLastTickTime] = useState(null);
  const [tickInterval, setTickInterval] = useState(15 * 60 * 1000);
  const [currentView, setCurrentView] = useState('home');
  const [leaderboardExpanded, setLeaderboardExpanded] = useState(false);

  useEffect(() => {
    loadData();
    const websocket = connectWebSocket();

    return () => {
      if (websocket) {
        websocket.close();
      }
    };
  }, []);

  const connectWebSocket = () => {
    // Connect to backend WebSocket server
    // In production (different domains), use the backend URL from env
    // In development (same domain), use localhost:3001
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    let wsUrl;
    
    if (import.meta.env.VITE_API_URL) {
      // Production: extract host from API URL (e.g., https://backend.onrender.com/api -> wss://backend.onrender.com)
      const apiUrl = import.meta.env.VITE_API_URL;
      const url = new URL(apiUrl);
      wsUrl = `${protocol === 'wss:' ? 'wss:' : 'ws:'}//${url.host}`;
    } else {
      // Development: same domain, use port 3001
      const host = window.location.hostname;
      wsUrl = `${protocol}//${host}:3001`;
    }
    
    const websocket = new WebSocket(wsUrl);

    websocket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'update') {
        setGameStats(message.data);
      } else if (message.type === 'tickInfo') {
        setLastTickTime(message.lastTickTime);
        setTickInterval(message.tickInterval);
      } else if (message.type === 'tick') {
        // Refresh the page when a tick happens
        window.location.reload();
      }
    };

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return websocket;
  };

  const loadData = async () => {
    try {
      const [gameResponse, userResponse] = await Promise.all([
        gameAPI.getStats(),
        gameAPI.getUserStats()
      ]);
      setGameStats(gameResponse.data);
      setUserStats(userResponse.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    // Reload user stats after any update
    try {
      const userResponse = await gameAPI.getUserStats();
      setUserStats(userResponse.data);
    } catch (error) {
      console.error('Error reloading user stats:', error);
    }
  };

  if (loading) {
    return <div className="dashboard-loading">Loading...</div>;
  }

  const renderContent = () => {
    switch (currentView) {
      case 'earnings':
        return <EarningsReport userStats={userStats} />;
      case 'ships':
        return <ShipManagement userStats={userStats} onUpdate={handleUpdate} />;
      case 'active-ships':
        return <ActiveShipsView onBack={() => setCurrentView('home')} />;
      case 'fishing-areas':
        return <FishingAreasView onBack={() => setCurrentView('home')} />;
      case 'balance-history':
        return <BalanceHistoryView userStats={userStats} onBack={() => setCurrentView('home')} />;
      case 'home':
      default:
        return (
          <>
            <StatsPanel 
              gameStats={gameStats} 
              userStats={userStats}
              onStatClick={(statType) => {
                if (statType === 'total-players') {
                  setLeaderboardExpanded(true);
                } else if (statType === 'active-ships') {
                  setCurrentView('active-ships');
                } else if (statType === 'fishing-areas') {
                  setCurrentView('fishing-areas');
                } else if (statType === 'balance') {
                  setCurrentView('balance-history');
                } else if (statType === 'ships-owned') {
                  setCurrentView('ships');
                }
              }}
            />
            <ClanManagement userStats={userStats} onUpdate={handleUpdate} />
          </>
        );
    }
  };

  return (
    <div className="dashboard">
      <div className="dashboard-grid">
        <div className="dashboard-main">
          <TickCountdown lastTickTime={lastTickTime} tickInterval={tickInterval} />
          <Navigation currentView={currentView} onViewChange={setCurrentView} />
          {renderContent()}
        </div>
        <div className="dashboard-sidebar">
          <Leaderboard 
            expanded={leaderboardExpanded} 
            onToggleExpand={() => setLeaderboardExpanded(!leaderboardExpanded)}
          />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
