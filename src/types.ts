export type ClientPlatform = 'windows' | 'linux' | 'android' | 'ios' | 'macos';

export type ConnectionMode = 'p2p' | 'relay';

export interface Peer {
  id: string;
  name: string;
  platform: ClientPlatform;
  virtualIp: string;
  publicKey: string;
  endpoint: string;
  connectionMode: ConnectionMode;
  relayRegion?: string;
  latencyMs: number;
  txBytes: number;
  rxBytes: number;
  lastHandshake: string;
  isHost?: boolean;
  isSelf?: boolean;
  status: 'online' | 'idle' | 'offline';
  sharedFolder?: string;
}

export interface ACLRule {
  id: string;
  name: string;
  action: 'allow' | 'block';
  protocol: 'all' | 'tcp' | 'udp' | 'icmp';
  portRange?: string; // e.g. "25565", "1024-65535", "445"
  source: string; // "any" or CIDR or VIP
  destination: string; // "any" or CIDR or VIP
  description: string;
}

export interface Network {
  id: string;
  name: string;
  description: string;
  subnetCidr: string; // e.g. "10.147.19.0/24"
  gatewayIp: string;  // e.g. "10.147.19.1"
  listenPort: number; // e.g. 51820
  isPublic: boolean;
  hasPassword?: boolean;
  password?: string;
  inviteCode: string; // e.g. "VWAN-9K2P-X8F4"
  gameCategory?: string; // "Minecraft", "Terraria", "CS2", "General Gaming", "File Sharing", "Remote Office"
  region: string; // "NA-East", "EU-Central", "Asia-East", "Global", etc.
  maxPeers: number;
  ownerId: string;
  ownerName: string;
  createdAt: string;
  tags: string[];
  interfaceName: string; // e.g. "vwan0"
  isConnected: boolean;
  assignedVirtualIp: string; // e.g. "10.147.19.5"
  clientPrivateKey: string;
  clientPublicKey: string;
  aclPreset: 'full-mesh' | 'gaming-safe' | 'host-only' | 'custom';
  aclRules: ACLRule[];
  bandwidthCapMbps?: number; // 0 for unlimited
}

export interface LanGameBroadcast {
  id: string;
  networkId: string;
  gameName: string;
  hostPeerName: string;
  hostVirtualIp: string;
  port: number;
  protocol: 'TCP' | 'UDP' | 'TCP/UDP';
  maxPlayers: number;
  currentPlayers: number;
  mapOrWorldName: string;
  version?: string;
  startedAt: string;
}

export interface SharedFile {
  id: string;
  networkId: string;
  name: string;
  sizeBytes: number;
  uploaderName: string;
  uploaderVirtualIp: string;
  uploadedAt: string;
  sha256: string;
  mimeType: string;
  category: 'game_mod' | 'save_file' | 'document' | 'media' | 'archive' | 'other';
  downloadCount: number;
}

export interface PingPacket {
  seq: number;
  timeMs: number;
  status: 'success' | 'timeout';
  ttl: number;
}

export interface DERPRelayNode {
  id: string;
  region: string;
  city: string;
  country: string;
  stunPort: number;
  derpPort: number;
  latencyMs: number;
  status: 'operational' | 'degraded';
  currentRelaySessions: number;
}
