import QRCode from 'qrcode';
import { Network, Peer, WanHostEntry } from '../types';

// Base64 curve25519 style mock generator (32 bytes = 44 base64 chars ending with =)
export function generateWireGuardKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = '';
  for (let i = 0; i < 43; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result + '=';
}

export function generatePresharedKey(): string {
  return generateWireGuardKey();
}

export interface WireGuardConfigOptions {
  interfaceAddress: string; // e.g. "10.147.19.5/24"
  privateKey: string;
  listenPort?: number;
  dnsServer?: string;
  mtu?: number;
  serverPublicKey: string;
  serverEndpoint: string; // e.g. "vpn.vwan-hub.net:51820"
  allowedIps: string; // e.g. "10.147.19.0/24"
  persistentKeepalive?: number;
}

export function generateWgQuickConfig(options: WireGuardConfigOptions): string {
  return `[Interface]
# V-WAN Cross-Platform Virtual Network Adapter
Address = ${options.interfaceAddress}
PrivateKey = ${options.privateKey}
${options.listenPort ? `ListenPort = ${options.listenPort}\n` : ''}DNS = ${options.dnsServer || '10.147.19.1'}
MTU = ${options.mtu || 1420}

[Peer]
# V-WAN Gateway / DERP Mesh Relay
PublicKey = ${options.serverPublicKey}
Endpoint = ${options.serverEndpoint}
AllowedIPs = ${options.allowedIps}
PersistentKeepalive = ${options.persistentKeepalive || 25}
`;
}

export async function generateQRCodeDataUrl(text: string): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      errorCorrectionLevel: 'M',
      margin: 2,
      scale: 6,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });
  } catch (err) {
    console.error('QR code generation error:', err);
    return '';
  }
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function generateWanHostsFile(
  network: Network,
  peers: Peer[],
  customEntries: WanHostEntry[] = []
): string {
  const timestamp = new Date().toISOString();
  const netSlug = network.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

  let out = `# ==============================================================================
# V-WAN MASTER HOSTS RESOLUTION FILE (ADMINISTRATIVE WAN RESOLVER)
# Network Name   : ${network.name}
# Subnet CIDR    : ${network.subnetCidr}
# Interface      : ${network.interfaceName} (Gateway VIP: ${network.gatewayIp})
# Exported At    : ${timestamp}
# Access Level   : NETWORK ADMINISTRATOR ONLY
# Description    : Maps all virtual peer endpoints, gateways, and game servers.
# ==============================================================================

127.0.0.1       localhost
::1             localhost ip6-localhost ip6-loopback

# ------------------------------------------------------------------------------
# 1. CORE WAN GATEWAY & DERP RELAY SERVICES
# ------------------------------------------------------------------------------
${network.gatewayIp.padEnd(16)} gateway.vwan.internal ${netSlug}-gw vwan-gateway
${network.gatewayIp.padEnd(16)} stun.vwan.internal derp-relay.vwan.internal smb.vwan.internal

# ------------------------------------------------------------------------------
# 2. ACTIVE VIRTUAL LAN PEERS & CLIENT NODES (${peers.length} NODES)
# ------------------------------------------------------------------------------
`;

  peers.forEach((peer) => {
    const peerSlug = peer.name
      .toLowerCase()
      .replace(/\s*\(.*?\)/g, '')
      .replace(/\[.*?\]/g, '')
      .trim()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    const domain = `${peerSlug}.${netSlug}.vwan`;
    const hostComment = `# ${peer.platform.toUpperCase()} | ${peer.connectionMode === 'p2p' ? 'P2P Direct' : 'DERP Relay'} | ${peer.status}`;
    out += `${peer.virtualIp.padEnd(16)} ${domain.padEnd(32)} ${peerSlug.padEnd(20)} ${hostComment}\n`;
  });

  if (customEntries.length > 0) {
    out += `\n# ------------------------------------------------------------------------------
# 3. CUSTOM WAN DNS & DEDICATED GAME SERVER ALIASES (${customEntries.length} ENTRIES)
# ------------------------------------------------------------------------------\n`;
    customEntries.forEach((entry) => {
      const aliasStr = entry.aliases.length > 0 ? entry.aliases.join(' ') : '';
      out += `${entry.ip.padEnd(16)} ${entry.hostname.padEnd(32)} ${aliasStr.padEnd(20)} # ${entry.description || 'Custom'}\n`;
    });
  }

  out += `\n# ==============================================================================
# End of V-WAN Master Hosts File
# ==============================================================================
`;

  return out;
}
