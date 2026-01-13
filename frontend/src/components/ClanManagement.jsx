import React, { useState, useEffect } from 'react';
import { clansAPI } from '../api';
import './ClanManagement.css';

function ClanManagement({ userStats, onUpdate }) {
  const [clans, setClans] = useState([]);
  const [selectedClan, setSelectedClan] = useState(null);
  const [clanMembers, setClanMembers] = useState([]);
  const [clanName, setClanName] = useState('');
  const [renameName, setRenameName] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadClans();
    if (userStats?.clan) {
      loadClanMembers(userStats.clan.id);
      setSelectedClan(userStats.clan.id);
    }
  }, [userStats]);

  const loadClans = async () => {
    try {
      const response = await clansAPI.getAll();
      setClans(response.data);
    } catch (error) {
      console.error('Error loading clans:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadClanMembers = async (clanId) => {
    try {
      const response = await clansAPI.getMembers(clanId);
      setClanMembers(response.data);
    } catch (error) {
      console.error('Error loading clan members:', error);
    }
  };

  const handleCreateClan = async (e) => {
    e.preventDefault();
    if (!clanName.trim()) return;

    try {
      await clansAPI.create(clanName.trim());
      setMessage({ type: 'success', text: 'Clan created successfully!' });
      setClanName('');
      if (onUpdate) onUpdate();
      loadClans();
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to create clan' });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleJoinClan = async (clanId) => {
    try {
      await clansAPI.join(clanId);
      setMessage({ type: 'success', text: 'Joined clan successfully!' });
      if (onUpdate) onUpdate();
      loadClans();
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to join clan' });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleLeaveClan = async () => {
    try {
      await clansAPI.leave();
      setMessage({ type: 'success', text: 'Left clan successfully!' });
      setSelectedClan(null);
      setClanMembers([]);
      if (onUpdate) onUpdate();
      loadClans();
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to leave clan' });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleRenameClan = async (e) => {
    e.preventDefault();
    if (!renameName.trim()) return;

    try {
      await clansAPI.rename(renameName.trim());
      setMessage({ type: 'success', text: 'Clan renamed successfully!' });
      setRenameName('');
      if (onUpdate) onUpdate();
      loadClans();
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to rename clan' });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const userClan = userStats?.clan;

  if (loading) {
    return <div className="clan-management">Loading...</div>;
  }

  return (
    <div className="clan-management">
      <h2>Clan Management</h2>

      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      {userClan ? (
        <div className="clan-info">
          <div className="clan-header">
            <h3>Your Clan: {userClan.name}</h3>
            {userClan.is_creator === 1 && (
              <span className="creator-badge">Creator</span>
            )}
            <button onClick={handleLeaveClan} className="btn-leave">Leave Clan</button>
          </div>

          {userClan.is_creator === 1 && (
            <form onSubmit={handleRenameClan} className="rename-form">
              <input
                type="text"
                value={renameName}
                onChange={(e) => setRenameName(e.target.value)}
                placeholder="New clan name"
              />
              <button type="submit" className="btn-rename">Rename Clan</button>
            </form>
          )}

          <div className="clan-members">
            <h4>Members</h4>
            <div className="members-list">
              {clanMembers.map(member => (
                <div key={member.id} className="member-item">
                  <span className="member-name">{member.username}</span>
                  {member.is_creator === 1 && (
                    <span className="creator-badge-small">Creator</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="clan-actions">
          <form onSubmit={handleCreateClan} className="create-clan-form">
            <h3>Create a Clan</h3>
            <input
              type="text"
              value={clanName}
              onChange={(e) => setClanName(e.target.value)}
              placeholder="Clan name"
              required
            />
            <button type="submit" className="btn-create">Create Clan</button>
          </form>

          <div className="join-clan">
            <h3>Join a Clan</h3>
            <div className="clans-list">
              {clans.length === 0 ? (
                <p>No clans available</p>
              ) : (
                clans.map(clan => (
                  <div key={clan.id} className="clan-item">
                    <div className="clan-item-info">
                      <span className="clan-item-name">{clan.name}</span>
                      <span className="clan-item-members">{clan.member_count} members</span>
                    </div>
                    <button
                      onClick={() => handleJoinClan(clan.id)}
                      className="btn-join"
                    >
                      Join
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ClanManagement;