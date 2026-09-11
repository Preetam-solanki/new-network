import QRCode from 'qrcode';

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
