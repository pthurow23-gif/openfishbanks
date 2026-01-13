import axios from 'axios';

// Use environment variable for API URL, or default to relative path for same-domain
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const authAPI = {
  register: (username, password) => api.post('/register', { username, password }),
  login: (username, password) => api.post('/login', { username, password }),
  logout: () => api.post('/logout'),
  getMe: () => api.get('/me')
};

export const gameAPI = {
  getStats: () => api.get('/game/stats'),
  getUserStats: () => api.get('/user/stats'),
  getLeaderboard: (limit) => api.get('/leaderboard', { params: { limit } }),
  getPlayersShips: () => api.get('/players/ships')
};

export const shipsAPI = {
  getAll: () => api.get('/ships'),
  buy: (shipId) => api.post('/ships/buy', { shipId }),
  assign: (shipId, areaId) => api.post('/ships/assign', { shipId, areaId })
};

export const areasAPI = {
  getAll: () => api.get('/areas')
};

export const clansAPI = {
  getAll: () => api.get('/clans'),
  create: (name) => api.post('/clans/create', { name }),
  join: (clanId) => api.post('/clans/join', { clanId }),
  leave: () => api.post('/clans/leave'),
  rename: (newName) => api.post('/clans/rename', { newName }),
  getMembers: (clanId) => api.get(`/clans/${clanId}/members`)
};

export const adminAPI = {
  processTick: () => api.post('/admin/tick'),
  getAreas: () => api.get('/admin/areas'),
  createArea: (areaData) => api.post('/admin/areas/create', areaData),
  resetAreaStock: (areaId, amount) => api.post(`/admin/areas/${areaId}/reset-stock`, { amount }),
  addFishToArea: (areaId, amount) => api.post(`/admin/areas/${areaId}/add-fish`, { amount }),
  setAreaRegenerationRate: (areaId, rate) => api.post(`/admin/areas/${areaId}/set-regeneration-rate`, { rate }),
  setAreaFishPrice: (areaId, price) => api.post(`/admin/areas/${areaId}/set-fish-price`, { price }),
  deleteClan: (clanId) => api.delete(`/admin/clans/${clanId}`),
  getUsers: () => api.get('/admin/users'),
  modifyUserBalance: (userId, amount) => api.post(`/admin/users/${userId}/balance`, { amount }),
  addShipToUser: (userId, shipId) => api.post(`/admin/users/${userId}/ships`, { shipId }),
  removeShipFromUser: (userId, userShipId) => api.delete(`/admin/users/${userId}/ships/${userShipId}`),
  setShipOperatingCost: (shipId, operatingCost) => api.post(`/admin/ships/${shipId}/operating-cost`, { operatingCost })
};

export default api;