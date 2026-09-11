import { Network, Peer, LanGameBroadcast, SharedFile } from './types';
import { INITIAL_NETWORKS, MOCK_PEERS_BY_NETWORK, INITIAL_LAN_GAMES, INITIAL_SHARED_FILES } from './mockData';

const NETWORKS_KEY = 'vwan_networks_v1';
const PEERS_KEY = 'vwan_peers_v1';
const GAMES_KEY = 'vwan_games_v1';
const FILES_KEY = 'vwan_files_v1';
const USERNAME_KEY = 'vwan_user_name_v1';
const CLIENT_OS_KEY = 'vwan_client_os_v1';

export function loadNetworks(): Network[] {
  try {
    const raw = localStorage.getItem(NETWORKS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load networks from storage', e);
  }
  return INITIAL_NETWORKS;
}

export function saveNetworks(networks: Network[]) {
  try {
    localStorage.setItem(NETWORKS_KEY, JSON.stringify(networks));
  } catch (e) {
    console.error('Failed to save networks', e);
  }
}

export function loadPeers(): Record<string, Peer[]> {
  try {
    const raw = localStorage.getItem(PEERS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load peers', e);
  }
  return MOCK_PEERS_BY_NETWORK;
}

export function savePeers(peers: Record<string, Peer[]>) {
  try {
    localStorage.setItem(PEERS_KEY, JSON.stringify(peers));
  } catch (e) {
    console.error('Failed to save peers', e);
  }
}

export function loadLanGames(): LanGameBroadcast[] {
  try {
    const raw = localStorage.getItem(GAMES_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load games', e);
  }
  return INITIAL_LAN_GAMES;
}

export function saveLanGames(games: LanGameBroadcast[]) {
  try {
    localStorage.setItem(GAMES_KEY, JSON.stringify(games));
  } catch (e) {
    console.error('Failed to save games', e);
  }
}

export function loadSharedFiles(): SharedFile[] {
  try {
    const raw = localStorage.getItem(FILES_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load files', e);
  }
  return INITIAL_SHARED_FILES;
}

export function saveSharedFiles(files: SharedFile[]) {
  try {
    localStorage.setItem(FILES_KEY, JSON.stringify(files));
  } catch (e) {
    console.error('Failed to save files', e);
  }
}

export function getStoredUsername(): string {
  return localStorage.getItem(USERNAME_KEY) || 'Your-Laptop (This Device)';
}

export function setStoredUsername(name: string) {
  localStorage.setItem(USERNAME_KEY, name);
}

export function getStoredClientPlatform(): 'windows' | 'linux' | 'android' | 'ios' | 'macos' {
  return (localStorage.getItem(CLIENT_OS_KEY) as any) || 'windows';
}

export function setStoredClientPlatform(os: 'windows' | 'linux' | 'android' | 'ios' | 'macos') {
  localStorage.setItem(CLIENT_OS_KEY, os);
}

export function resetToDefaults(): {
  networks: Network[];
  peers: Record<string, Peer[]>;
  games: LanGameBroadcast[];
  files: SharedFile[];
} {
  localStorage.removeItem(NETWORKS_KEY);
  localStorage.removeItem(PEERS_KEY);
  localStorage.removeItem(GAMES_KEY);
  localStorage.removeItem(FILES_KEY);
  return {
    networks: INITIAL_NETWORKS,
    peers: MOCK_PEERS_BY_NETWORK,
    games: INITIAL_LAN_GAMES,
    files: INITIAL_SHARED_FILES,
  };
}
