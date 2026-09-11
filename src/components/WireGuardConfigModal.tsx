import React, { useState, useEffect } from 'react';
import { X, Download, Copy, Check, QrCode, Shield, Terminal, Smartphone, Monitor } from 'lucide-react';
import { Network, ClientPlatform } from '../types';
import { generateWgQuickConfig, generateQRCodeDataUrl } from '../utils/wireguard';

interface WireGuardConfigModalProps {
  network: Network | null;
  clientPlatform: ClientPlatform;
  onClose: () => void;
}

export const WireGuardConfigModal: React.FC<WireGuardConfigModalProps> = ({
  network,
  clientPlatform,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'config' | 'qr' | 'cli'>('config');

  if (!network) return null;

  const serverEndpoint = 'vwan-gateway.net:51820';
  const serverPublicKey = 'Bm9PqX7eR1Z4tK0wU2yV8sL5nM3jH6dF9aC2eG4iK1M=';

  const configText = generateWgQuickConfig({
    interfaceAddress: `${network.assignedVirtualIp}/24`,
    privateKey: network.clientPrivateKey,
    listenPort: network.listenPort || 51820,
    dnsServer: network.gatewayIp,
    mtu: 1420,
    serverPublicKey,
    serverEndpoint,
    allowedIps: network.subnetCidr,
    persistentKeepalive: 25,
  });

  useEffect(() => {
    let isMounted = true;
    generateQRCodeDataUrl(configText).then((url) => {
      if (isMounted) setQrCodeUrl(url);
    });
    return () => {
      isMounted = false;
    };
  }, [configText]);

  const handleCopy = () => {
    navigator.clipboard.writeText(configText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([configText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${network.interfaceName || 'vwan0'}.conf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getCliCommand = () => {
    switch (clientPlatform) {
      case 'linux':
        return `# Save configuration to /etc/wireguard/${network.interfaceName}.conf
sudo cp ${network.interfaceName}.conf /etc/wireguard/
# Start WireGuard tunnel interface
sudo wg-quick up ${network.interfaceName}
# Verify virtual IP and handshake
sudo wg show ${network.interfaceName}`;
      case 'windows':
        return `# In Windows PowerShell (as Administrator)
wireguard.exe /installtunnelservice C:\\Path\\To\\${network.interfaceName}.conf
# Or import directly via WireGuard for Windows GUI -> "Add Tunnel"`;
      case 'macos':
        return `# Using Homebrew WireGuard tools:
brew install wireguard-tools
sudo wg-quick up ./${network.interfaceName}.conf`;
      default:
        return `# Use the Official WireGuard App on iOS or Android:
1. Open the WireGuard App
2. Tap the '+' button -> "Scan from QR code"
3. Scan the QR code tab above to import immediately!`;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                WireGuard® Tunnel Profile
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700">
                  {network.interfaceName}.conf
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Network: <span className="text-slate-200 font-semibold">{network.name}</span> • Subnet: <span className="font-mono text-emerald-300">{network.subnetCidr}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-2 px-5 py-2.5 bg-slate-850 border-b border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('config')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'config'
                ? 'bg-emerald-600 text-white font-semibold'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>wg-quick Config File</span>
          </button>

          <button
            onClick={() => setActiveTab('qr')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'qr'
                ? 'bg-emerald-600 text-white font-semibold'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Mobile QR Code (iOS / Android)</span>
          </button>

          <button
            onClick={() => setActiveTab('cli')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'cli'
                ? 'bg-emerald-600 text-white font-semibold'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>CLI Commands ({clientPlatform})</span>
          </button>
        </div>

        {/* Body content */}
        <div className="p-5 flex-1 overflow-y-auto">
          {activeTab === 'config' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Standard INI format for WireGuard tunnel manager</span>
                <span className="font-mono text-emerald-400 font-semibold">Assigned VIP: {network.assignedVirtualIp}</span>
              </div>
              <div className="relative">
                <pre className="bg-black/70 border border-slate-800 rounded-lg p-4 font-mono text-xs text-emerald-300 overflow-x-auto leading-relaxed shadow-inner">
                  {configText}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'qr' && (
            <div className="flex flex-col items-center justify-center py-4 space-y-4">
              <div className="bg-white p-4 rounded-xl shadow-xl border-4 border-slate-800">
                {qrCodeUrl ? (
                  <img src={qrCodeUrl} alt="WireGuard QR Code" className="w-56 h-56 block" />
                ) : (
                  <div className="w-56 h-56 flex items-center justify-center text-slate-400 text-xs">
                    Generating QR code...
                  </div>
                )}
              </div>
              <div className="text-center max-w-sm">
                <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-200 mb-1">
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  <span>Scan with Official WireGuard App</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Works directly with WireGuard for Android (Google Play / F-Droid) and WireGuardKit for iOS (App Store).
                  Creates virtual interface on mobile without desktop tethering.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'cli' && (
            <div className="space-y-4">
              <div className="text-xs text-slate-300 leading-relaxed">
                Connect your native operating system directly using standard open-source tools:
              </div>
              <pre className="bg-black/70 border border-slate-800 rounded-lg p-4 font-mono text-xs text-amber-300 overflow-x-auto leading-relaxed shadow-inner">
                {getCliCommand()}
              </pre>
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-3 text-xs text-slate-300 space-y-1">
                <span className="font-semibold text-white block">Multi-Network Support:</span>
                <p className="text-slate-400 text-[11px]">
                  Each network runs on a dedicated virtual adapter (<code className="text-emerald-300">vwan0</code>, <code className="text-emerald-300">vwan1</code>). You can maintain simultaneous tunnels to gaming VLANs and homelabs without IP collisions.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <button
            onClick={handleDownload}
            className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Download {network.interfaceName}.conf</span>
          </button>

          <button
            onClick={handleCopy}
            className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied to Clipboard!' : 'Copy Config'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
